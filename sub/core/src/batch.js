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
    mutations = _.flattenDeep(mutations);

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
    mutations = _.flattenDeep(mutations);

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

      // Create the response (GraphQL mutation API).
      // http://dev.apollodata.com/react/mutations.html#optimistic-ui
      // http://dev.apollodata.com/react/optimistic-ui.html#optimistic-basics
      // http://dev.apollodata.com/react/cache-updates.html
      optimisticResponse = {

        // Add hint for reducer.
        optimistic: true,

        upsertItems
      };
    }


    console.log('>>>>>>>>>>>>', JSON.stringify(optimisticResponse, 0, 2));


    // Submit mutation.
    this._mutate({
      variables: {
        mutations: this._mutations
      },

      optimisticResponse
    });
  }
}
