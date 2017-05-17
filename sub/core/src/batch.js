//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';

import { Logger, TypeUtil } from 'alien-util';

import { Database } from './database';
import { ID } from './id';
import { MutationUtil, UpsertItemsMutationName } from './mutations';
import { Transforms } from './transforms';

const logger = Logger.get('batch');

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
    this._mutations = [];
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

    let itemId = this._idGenerator.createId();
    this._items.set(itemId, { type, id: itemId });

    // TODO(burdon): Enforce server-side (and/or move into schema proto).
    mutations.unshift(
      MutationUtil.createFieldMutation('bucket', 'string', this._bucket),
      MutationUtil.createFieldMutation('type', 'string', type)
    );

    this._mutations.push({
      bucket: this._bucket,
      itemId: ID.toGlobalId(type, itemId),
      mutations
    });

    if (label) {
      this._refs.set(label, itemId);
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

    this._mutations.push({
      bucket: this._bucket,
      itemId: ID.toGlobalId(item.type, item.id),
      mutations: _.map(mutations, mutation => {
        if (_.isFunction(mutation)) {
          return mutation.call(this, this.refs);
        } else {
          return mutation;
        }
      })
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
      let upsertItems = _.map(this._mutations, mutation => {
        let { itemId, mutations } = mutation;
        let { id } = ID.fromGlobalId(itemId);
        let item = this._items.get(id);
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

        // http://dev.apollodata.com/react/optimistic-ui.html
        // http://dev.apollodata.com/react/api-mutations.html#graphql-mutation-options-optimisticResponse
        // http://dev.apollodata.com/react/api-mutations.html#graphql-mutation-options-update
        let updatedItem = Transforms.applyObjectMutations(_.cloneDeep(item), mutations);

        // TODO(burdon): Mutation patching above isn't right since patching Item into "id" field.

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

        // Add hint for reducer.
//      optimistic: true,

        upsertItems
      };
    }

    //
    // Submit mutation.
    // http://dev.apollodata.com/react/mutations.html#calling-mutations
    // http://dev.apollodata.com/core/apollo-client-api.html#ApolloClient.mutate
    //
    return this._mutate({

      // Input to the mutation.
      variables: {
        mutations: this._mutations
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
       * @param {DatProxy} proxy http://dev.apollodata.com/core/apollo-client-api.html#DataProxy
       * @param {Object} data Mutation result.
       */
      update: (proxy, { data }) => {
        console.log('## BATCH UPDATE ===========>', data);

        // TODO(burdon): Update specific queries (register here).

        // Read the data from our cache for this query.
        // let data = store.readQuery({ query: TestQuery });
        // Add our comment from the mutation to the end.
        // data.comments.push(submitComment);
        // Write our data back to the cache.
        // store.writeQuery({ query: CommentAppQuery, data });
      }

    }).then(({ data }) => {

      // Called when on network response (not optimistic response).
      logger.log('Commit', TypeUtil.stringify(data));
      return true;
    });
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

        let cloneMutations = _.concat(
          // Mutations to clone the item's properties.
          // TODO(burdon): Remove mutations for current properties below.
          MutationUtil.cloneItem(this._bucket, item),

          // Current mutations.
          mutations
        );

        // TODO(burdon): Add fkey (e.g., email)?
        this.createItem(item.type, cloneMutations, label);
        return true;
      }

      //
      // Clone external item on mutation.
      // NOTE: This assumes that external items are never presented to the client when a USER item
      // exists; i.e., external/USER items are merged on the server (Database.search).
      //
      default: {
        logger.log('Cloning item: ' + JSON.stringify(_.pick(item, 'namespace', 'type', 'id')));

        let cloneMutations = _.concat(
          // Reference the external item.
          MutationUtil.createFieldMutation('fkey', 'string', ID.getForeignKey(item)),

          // Mutations to clone the item's properties.
          // TODO(burdon): Remove mutations for current properties below.
          MutationUtil.cloneItem(this._bucket, item),

          // Current mutations.
          mutations
        );

        this.createItem(item.type, cloneMutations, label);
        return true;
      }
    }
  }
}
