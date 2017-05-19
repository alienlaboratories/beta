//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';
// import gql from 'graphql-tag';

import { Logger, TypeUtil } from 'alien-util';

import { Database } from './database';
import { ID } from './id';
import { MutationUtil, UpsertItemsMutationName } from './mutations';
import { Transforms } from './transforms';

import { Fragments } from './fragments';

const logger = Logger.get('batch');

// TODO(burdon): Items.
// TODO(burdon): Custom resolver?
// export const SearchQuery = gql`
//   query SearchQuery($filter: FilterInput) {
//     search(filter: $filter) {
//       items {
//         id
//         title
//
//         ... on Project {
//           tasks {
//             id
//             title
//           }
//         }
//       }
//     }
//   }
// `;
// const ItemQuery = gql`
//   query ItemQuery($key: Key) {
//     item(key: $key) {
//       id
//       title
//     }
//   }
// `;

/**
 * Batch mutations.
 */
export class Batch {

  /**
   * Manages batch mutations.
   *
   * new Batch(idGenerator, mutator, bucket, true)
   *
   *   .createItem('Task', [
   *     MutationUtil.createFieldMutation('title', 'string', 'Test')
   *   ], 'task')
   *
   *   .updateItem({ id: 'P-1', type: 'Project' }, [
   *     MutationUtil.createSetMutation('labels', 'string', 'foo')
   *     ({ task }) => MutationUtil.createSetMutation('tasks', 'id', task.id)
   *   ])
   *
   *   .commit();
   *
   * @param {IdGenerator} idGenerator.
   * @param {function.<{Options}>} mutate Mutate function provided by Apollo.
   * @param {string} bucket All batched operations must belong to the same bucket.
   * @param {boolean} optimistic
   * @private
   */
  constructor(idGenerator, mutate, bucket, optimistic=false) {
    console.assert(idGenerator && mutate && bucket);

    this._idGenerator = idGenerator;
    this._mutate = mutate;
    this._bucket = bucket;
    this._optimistic = optimistic;

    this._refs = new Map();
    this._items = new Map();
    this._itemMutations = [];
  }

  /**
   * Returns an object containing label:Item values for each referenced value in the batch.
   * @returns {{}}
   */
  get refs() {
    let refs = {};
    this._refs.forEach((itemId, label) => {
      let item = this._items.get(itemId);
      console.assert(item);
      refs[label] = item;
    });

    return refs;
  }

  /**
   * Create a new item.
   * @param {string} type Item type.
   * @param {[{Mutation}]} mutations Mutations to apply.
   * @param {string} label Optional label that can be used as a reference for subsequent batch operations.
   * @returns {Batch}
   */
  createItem(type, mutations, label=undefined) {
    console.assert(type && mutations);
    mutations = _.compact(_.flattenDeep(mutations));

    let id = this._idGenerator.createId();
    let key = { bucket: this._bucket, type, id };
    this._items.set(id, key);

    // TODO(burdon): Move to mutation key and set server side (rather than by field mutation).
    mutations.unshift(
      MutationUtil.createFieldMutation('bucket', 'string', this._bucket),
      MutationUtil.createFieldMutation('type', 'string', type)
    );

    this._itemMutations.push({
      key,
      mutations: _.map(mutations, mutation => this._resolve(mutation))
    });

    if (label) {
      this._refs.set(label, id);
    }

    return this;
  }

  /**
   * Update an existing item.
   * @param {Item} item Item to mutate.
   * @param {[{Mutation}|function]} mutations Mutations to apply.
   * @param {string} label Optional label that can be used as a reference for subsequent batch operations.
   * @returns {Batch}
   */
  updateItem(item, mutations, label=undefined) {
    console.assert(item && item.id && mutations);
    mutations = _.compact(_.flattenDeep(mutations));

    // Transient and external items should be cloned.
    if (this._copyOnWrite(item, mutations, label)) {
      return this;
    }

    this._items.set(item.id, item);
    let key = { bucket: this._bucket, type: item.type, id: item.id };

    this._itemMutations.push({
      key,
      mutations: _.map(mutations, mutation => this._resolve(mutation))
    });

    if (label) {
      this._refs.set(label, item.id);
    }

    return this;
  }

  /**
   * Commit all changes.
   * @returns {Promise}
   */
  commit() {

    // Create optimistic response.
    let optimisticResponse;
    if (this._optimistic) {

      // Apply the mutations to the current (cloned) items.
      let upsertItems = _.map(this._itemMutations, mutation => {
        let { key, mutations } = mutation;
        let item = this._items.get(key.id);
        console.assert(item);

        // Patch IDs with items.
        // Clone mutations, iterate tree and replace id with object value.
        // NOTE: This isn't 100% clean since theoretically some value mutations may legitimately deal with IDs.
        // May need to "mark" ID values when set in batch mutation API call.
        mutations = _.cloneDeep(mutations);
        TypeUtil.traverse(mutations, (value, key, root) => {
          if (key === 'id') {
            let referencedItem = this._items.get(value);
            if (referencedItem) {
              root[key] = referencedItem;
            }
          }
        });

        // TODO(burdon): Move to batch.update below.
        // TODO(burdon): Mutation patching above isn't right since patching Item into "id" field?
        // http://dev.apollodata.com/react/optimistic-ui.html
        // http://dev.apollodata.com/react/api-mutations.html#graphql-mutation-options-optimisticResponse
        // http://dev.apollodata.com/react/api-mutations.html#graphql-mutation-options-update
        let updatedItem = Transforms.applyObjectMutations(_.cloneDeep(item), mutations);

        // Update the batch's cache for patching above.
        this._items.set(item.id, updatedItem);

        // Important for update.
        _.assign(updatedItem, {
          __typename: item.type
        });

        return updatedItem;
      });

      // Create the response (GraphQL mutation API).
      // http://dev.apollodata.com/react/mutations.html#optimistic-ui
      // http://dev.apollodata.com/react/optimistic-ui.html#optimistic-basics
      // http://dev.apollodata.com/react/cache-updates.html
      optimisticResponse = {
        __typename: UpsertItemsMutationName,

        // Add hint for batch.update.
        optimistic: true,

        // status: 200
        upsertItems
      };
    }

    //
    // Submit mutation.
    // http://dev.apollodata.com/react/mutations.html#calling-mutations
    // http://dev.apollodata.com/core/apollo-client-api.html#ApolloClient.mutate
    //
    logger.log('Batch:', TypeUtil.stringify(this._itemMutations));
    return this._mutate({

      // RootMutation.upsertItems([ItemMutationInput]!)
      variables: {
        itemMutations: this._itemMutations
      },

      optimisticResponse,

      // TODO(burdon): refetchQueries
      // TODO(burdon): updateQueries

      /**
       * Updates the cache.
       * By default the cache is updates items that match ApolloClient.dataIdFromObject.
       * This method allows for the update of cached queries (and replaces deprecated reducers).
       *
       * Called for both optimistic and network mutation response.
       * Once immediately after client.mutate with the optimisticResponse.
       * After the network response the optimistic changes are rolled back and update called with the actual data.
       *
       * http://dev.apollodata.com/react/cache-updates.html#directAccess
       * http://dev.apollodata.com/react/api-mutations.html#graphql-mutation-options-update
       * http://dev.apollodata.com/core/read-and-write.html#updating-the-cache-after-a-mutation
       *
       * @param {DataProxy} proxy http://dev.apollodata.com/core/apollo-client-api.html#DataProxy
       * @param {Object} data Mutation result.
       */
      update: (proxy, { data }) => {
        logger.log('Batch.mutate.update', data);

        // TODO(burdon): Move Transforms.applyObjectMutations (from above) here.

        // TODO(burdon): Worst case: run mutations against all queries?
        // But fragments returned are empty.

        let key = this._itemMutations[0].key;
        console.log('Key', key);

        // http://dev.apollodata.com/core/apollo-client-api.html#DataProxy.readFragment
        let item1 = proxy.readFragment({
          fragment: Fragments.ItemFragment,
          fragmentName: 'ItemFragment',
          id: 'Task:T-1'
        });
        console.log('############', item1);

        let item2 = proxy.readFragment({
          fragment: Fragments.ItemFragment,
          fragmentName: 'ItemFragment',
          id: 'Project:P-1'
        });
        console.log('############', item2);

        // proxy.writeFragment({
        //   fragment: Fragments.ItemFragment,
        //   fragmentName: 'ItemFragment',
        //   id: key.type + ':' + key.id,
        //   data: {
        //     __typename: 'Task',
        //     title: 'xxx'
        //   }
        // });

        // TODO(burdon): Error with optimistic updates (selection set doesn't match).
        // TypeError: Cannot read property 'variables' of undefined
        // https://github.com/apollographql/apollo-client/issues/1708

//         console.log(this._itemMutations[0]);
//         // Read the data from our cache for this query.
//         let filter = { type, ids: [ id ] };
//         console.log('>>>>', JSON.stringify(filter));
//
//         // TODO(burdon): readQuery only matches exact query (otherwise throws error).
//         const ProjectFilter = {
//           type: 'Project',
//           expr: {
//             comp: 'IN',
//             field: 'labels',
//             value: {
//               string: '_default'
//             }
//           }
//         };
//
// //      let d2 = proxy.readQuery({ query: SearchQuery, variables: { filter:ProjectFilter } });
//         let d2 = proxy.readQuery({ query: ItemQuery, variables: { key: ID.key(this._itemMutations[0]) } });
//
//         let tasks = _.get(d2,'search.items[0].tasks');
//         console.log('#########', d2, tasks);
//
//         tasks[0].title = 'xxx';

        // proxy.writeQuery({
        //   query: SearchQuery,
        //   data: d2
        // });
      }

    }).then(({ data }) => {
      // Called when on network response (not optimistic response).
      logger.log('Commit', TypeUtil.stringify(data));
      return true;
    }).catch(err => {
      logger.error(err);
      return false;
    });
  }

  /**
   * Resolves mutation or mutation generator.
   * @param mutation
   * @return {*}
   * @private
   */
  _resolve(mutation) {
    if (_.isFunction(mutation)) {
      return mutation.call(this, this.refs);
    } else {
      return mutation;
    }
  }

  /**
   * Determines if the item should be cloned. If so, creates a new item.
   *
   * @param item
   * @param mutations
   * @param label
   * @return {boolean} True if the item was cloned.
   * @private
   */
  _copyOnWrite(item, mutations, label) {
    if (!item.namespace) {
      return false;
    }

    switch (item.namespace) {

      //
      // Normal item (do nothing).
      //
      case Database.NAMESPACE.USER: {
        return false;
      }

      //
      // Clone local (transient) item on mutation.
      //
      case Database.NAMESPACE.LOCAL: {
        logger.log('Cloning item: ' + JSON.stringify(_.pick(item, 'namespace', 'type', 'id')));

        let clonedMutations = _.concat(
          // Mutations to clone the item's properties.
          // TODO(burdon): Remove mutations for current properties below.
          MutationUtil.cloneItem(this._bucket, item),

          // Current mutations.
          mutations
        );

        // TODO(burdon): Add fkey (e.g., email)?
        this.createItem(item.type, clonedMutations, label);
        return true;
      }

      //
      // Clone external item on mutation.
      // NOTE: This assumes that external items are never presented to the client when a USER item
      // exists; i.e., external/USER items are merged on the server (Database.search).
      //
      default: {
        logger.log('Cloning item: ' + JSON.stringify(_.pick(item, 'namespace', 'type', 'id')));

        let clonedMutations = _.concat(
          // Reference the external item.
          // TODO(burdon): Key object.
          MutationUtil.createFieldMutation('fkey', 'string', ID.getForeignKey(item)),

          // Mutations to clone the item's properties.
          // TODO(burdon): Remove mutations for current properties below.
          MutationUtil.cloneItem(this._bucket, item),

          // Current mutations.
          mutations
        );

        this.createItem(item.type, clonedMutations, label);
        return true;
      }
    }
  }
}
