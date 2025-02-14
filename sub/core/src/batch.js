//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';

import { Logger, TypeUtil } from 'alien-util';

import { Database } from './database';
import { ID } from './id';
import { MutationUtil } from './mutation';
import { FragmentParser } from './schema';
import { Transforms } from './transforms';

const logger = Logger.get('batch');

/**
 * Batch mutations.
 */
export class Batch {

  /**
   * Manages batch mutations.
   *
   * new Batch(idGenerator, mutator, bucket, { optimistic: true, fragments, refetchQueries })
   *
   *   .createItem('Task', [
   *     MutationUtil.createFieldMutation('title', 'string', 'Test')
   *   ], 'task')
   *
   *   .updateItem({ id: 'P-1', type: 'Project' }, [
   *     MutationUtil.createSetMutation('labels', 'string', 'foo')
   *     ({ task }) => MutationUtil.createSetMutation('tasks', 'key', ID.key(task))
   *   ])
   *
   *   .commit();
   *
   * @param {IdGenerator} idGenerator.
   * @param {function.<{Options}>} mutate Mutate function provided by Apollo.
   * @param {string} bucket All batched operations must belong to the same bucket.
   * @param {{optimistic, fragments: {FragmentsMap}, refetchQueries: [{string}]}} options
   */
  constructor(idGenerator, mutate, bucket, options={}) {
    console.assert(idGenerator && mutate && bucket && options);

    // TODO(burdon): Enforce same bucket for entire batch? Otherwise multiple batches (e.g., private task for project).

    this._idGenerator = idGenerator;
    this._mutate = mutate;
    this._bucket = bucket;
    this._options = options;

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
    let key = { namespace: null, bucket: this._bucket, type, id };
    let item = { __typename: type, ...key, verson: 0 };
    this._items.set(id, item);

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
    if (this._options.optimistic) {
      logger.log('Creating optimistic response.');

      // Create the response (GraphQL mutation API).
      // NOTE: __typename is required to avoid warnings.
      // http://dev.apollodata.com/react/mutations.html#optimistic-ui
      // http://dev.apollodata.com/react/optimistic-ui.html#optimistic-basics
      // http://dev.apollodata.com/react/cache-updates.html
      optimisticResponse = {
        batchMutation: {

          // TODO(burdon): Use def.
          __typename: 'BatchMutationResponse',

          keys: _.map(this._itemMutations, itemMutation => ({ __typename: 'Key', ...itemMutation.key }))
        },

        // Add hint for batch.update.
        optimistic: true
      };
    }

    //
    // Submit mutation.
    // http://dev.apollodata.com/react/mutations.html#calling-mutations
    // http://dev.apollodata.com/core/apollo-client-api.html#ApolloClient.mutate
    //
    logger.log('Batch:', TypeUtil.stringify(this._itemMutations));
    return this._mutate({

      // TODO(burdon): updateQueries

      // RootMutation.batchMutation([ItemMutationInput]!)
      variables: {
        itemMutations: this._itemMutations
      },

      // http://dev.apollodata.com/react/optimistic-ui.html
      optimisticResponse,

      // http://dev.apollodata.com/core/read-and-write.html#updating-the-cache-after-a-mutation
      update: (proxy, { data }) => {
        this._doUpdate(proxy, data);
      },

      // http://dev.apollodata.com/react/api-mutations.html#graphql-mutation-options-refetchQueries
      refetchQueries: this._options.refetchQueries

    }).then(({ data }) => {
      // Called when on network response (not optimistic response).
      logger.log('Commit', TypeUtil.stringify(data));
      return { batch:this };
    }).catch(err => {
      logger.error(err);
      return { batch:this, error: err };
    });
  }

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
  _doUpdate(proxy, data) {
    logger.log('Batch.mutate.update', JSON.stringify(data));
    if (_.isEmpty(this._itemMutations)) {
      logger.warn('Empty batch: ' + JSON.stringify(data));
      return;
    }

    if (!this._options.fragments) {
      logger.warn('No fragments defined.');
      return;
    }

    // Process mutations.
    // TODO(burdon): Use actual mutations returned from optimisticResponse and server..
    _.each(this._itemMutations, itemMutation => {
      let { key, mutations } = itemMutation;

      // Apply to each fragment.
      _.each(this._options.fragments.getFragments(key.type), fragment => {
        let fragmentName = FragmentParser.getFragmentName(fragment);

        //
        // Read currently cached item (if exists).
        // http://dev.apollodata.com/core/apollo-client-api.html#DataProxy.readFragment
        //

        let cachedItem;
        try {
          cachedItem = proxy.readFragment({
            id: ID.createStoreId(key),
            fragment,
            fragmentName
          });
        } catch(err) {
          logger.error(err);
          throw err;
        }

        //
        // Apply mutations.
        // The FragmentParser provides a template item (with null fields for each fragment).
        // This avoids the "Missing fields" warnings.
        // Additionally nested Items are defined (in the fragments) only by key fields.
        // Apollo can use the `dataIdFromObject` property to match the associated cached Items.
        //

        let clonedItem = TypeUtil.clone(cachedItem || key);
        let mutatedItem = Transforms.applyObjectMutations({ client: true }, clonedItem, mutations);

        let parser = new FragmentParser(fragment);
        parser.getDefaultObject(mutatedItem);

        //
        // Update cache.
        //

        // http://dev.apollodata.com/core/apollo-client-api.html#ApolloClient.writeFragment
        try {
          logger.log('Writing:', JSON.stringify(ID.key(mutatedItem)), fragmentName);
          proxy.writeFragment({
            id: ID.createStoreId(mutatedItem),
            fragment,
            fragmentName,
            data: mutatedItem
          });
        } catch(err) {
          logger.error(err);
          logger.warn('Mutated item:', JSON.stringify(mutatedItem, null, 2));
        }

        //
        // TODO(burdon): Debug only.
        // Check updated.
        //

        const debug = true;
        if (debug) {
          cachedItem = proxy.readFragment({
            id: ID.createStoreId(mutatedItem),
            fragment,
            fragmentName
          });

          let storeItem = proxy.data[ ID.createStoreId(cachedItem) ];
          console.assert(cachedItem.id === storeItem.id);
        }
      });
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
      // TODO(burdon): Read args and check ref exists.
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
          // TODO(burdon): Remove mutations included below.
          MutationUtil.cloneItem(item),

          // Current mutations.
          mutations
        );

        // TODO(burdon): Reuse key?
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
          // TODO(burdon): Move to server? (normalize with above).
          // Reference the external item.
          MutationUtil.createFieldMutation('fkey', 'string', ID.getForeignKey(item)),

          // Mutations to clone the item's properties.
          // TODO(burdon): Remove mutations included below.
          MutationUtil.cloneItem(item),

          // Current mutations.
          mutations
        );

        this.createItem(item.type, clonedMutations, label);
        return true;
      }
    }
  }
}
