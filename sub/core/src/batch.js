//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';

import { TypeUtil } from 'alien-util';

import { ID } from './id';
import { MutationUtil } from './mutations';
import { Transforms } from './transforms';

/**
 * Batch mutations.
 */
export class Batch {

  /**
   * Creates a generator that will be called with the ID of the referenced item to create the mutation.
   * @param {string} label
   * @param {function({Item})} callback Callback returns a {Mutation}.
   */
  static ref(label, callback) {
    return (batch) => {
      let itemId = batch._refs.get(label);
      console.assert(itemId);
      let item = batch._items.get(itemId);
      console.assert(item);
      return callback(item);
    };
  }

  /**
   * Manages batch mutations.
   *
   * @param {function.<{Options}>} mutate Mutate function provided by Apollo.
   * @param {IdGenerator} idGenerator.
   * @param {string} bucket All batched operations must belong to the same bucket.
   * @param {boolean} optimistic
   * @private
   */
  constructor(mutate, idGenerator, bucket, optimistic=false) {
    console.assert(mutate && idGenerator && bucket);

    this._mutate = mutate;
    this._idGenerator = idGenerator;
    this._bucket = bucket;
    this._optimistic = optimistic;

    this._refs = new Map();
    this._items = new Map();
    this._mutations = [];
  }

  /**
   * Create a new item.
   * @param {string} type Item type.
   * @param {[{Mutation}]} mutations Mutations to apply.
   * @param {string} ref Optional label that can be used as a reference for subsequent batch operations.
   * @returns {Batch}
   */
  createItem(type, mutations, ref=undefined) {
    console.assert(type && mutations);

    let itemId = this._idGenerator.createId();
    this._items.set(itemId, { type, id: itemId });

    // TODO(burdon): Remove from client (when transplant to current app).
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

    if (ref) {
      this._refs.set(ref, itemId);
    }

    return this;
  }

  /**
   * Update an existing item.
   * @param {Item} item Item to mutate.
   * @param {[{Mutation}]} mutations Mutations to apply.
   * @returns {Batch}
   */
  updateItem(item, mutations) {
    console.assert(item && mutations);
    this._items.set(item.id, item);

    this._mutations.push({
      bucket: this._bucket,
      itemId: ID.toGlobalId(item.type, item.id),
      mutations: _.map(mutations, mutation => {
        if (_.isFunction(mutation)) {
          return mutation(this);
        } else {
          return mutation;
        }
      })
    });

    return this;
  }

  /**
   * Commit all changes.
   */
  commit() {

    // Create optimistic response.
    let optimisticResponse = undefined;
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
        // TODO(burdon): Leave ID and patch in reducer?

        // Update the batch's cache for patching above.
        this._items.set(item.id, updatedItem);

        // Important for update.
        _.assign(updatedItem, {
          __typename: item.type
        });

        return updatedItem;
      });

      optimisticResponse = {
        upsertItems
      };
    }

    // Submit mutation.
    this._mutate({
      variables: {
        mutations: this._mutations
      },

      optimisticResponse
    });
  }
}
