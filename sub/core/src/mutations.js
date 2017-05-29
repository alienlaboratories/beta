//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';

import { Batch } from './batch';
import { Fragments } from './fragments';

// TODO(burdon): Project board fragment shouldn't return all items.
// TODO(madadam): Think more about "thin vs fat" fragments for the generic mutation.
// Since we're using a single generic mutation type, it has to be configured to retrieve
// any data needed by any component, including detailed nested objects (e.g. ContactTaskFragment).
// Unclear if there's a material downside to this, but it feels wrong.

// TODO(burdon): Return updated mutations (e.g., ID replaced with object) and store in batch.update.

export const UpsertItemsMutation = gql`
  mutation UpsertItemsMutation($itemMutations: [ItemMutationInput]!) {
    upsertItems(itemMutations: $itemMutations) {
      ...ItemFragment
      ...ContactTasksFragment
      ...TaskFragment
      ...ProjectBoardFragment
    }
  }

  ${Fragments.ItemFragment}
  ${Fragments.ContactTasksFragment}
  ${Fragments.TaskFragment}
  ${Fragments.ProjectBoardFragment}
`;

export const UpsertItemsMutationName = // 'UpsertItemsMutation'
  _.get(UpsertItemsMutation, 'definitions[0].name.value');

export const UpsertItemsMutationPath = // 'upsertItems'
  _.get(UpsertItemsMutation, 'definitions[0].selectionSet.selections[0].name.value');

/**
 * Utils to create mutations.
 */
export class MutationUtil {

  static DEF_ITEM_KEYS = {
    title:          'string',
    email:          'string',
    thumbnailUrl:   'string'
  };

  /**
   * Create mutations to clone the given item.
   *
   * @param {Item} item
   * @param {[{ field:type }]} keys to clone.
   * @return {[Mutation]}
   */
  static cloneItem(item, keys=MutationUtil.DEF_ITEM_KEYS) {
    console.assert(item && keys);
    let mutations = [];

    _.each(keys, (type, key) => {
      let value = item[key];
      if (value) {
        mutations.push(MutationUtil.createFieldMutation(key, type, value));
      }
    });

    return mutations;
  }

  /**
   * Creates a set mutation.
   *
   * @param {string} field
   * @param {string} type
   * @param {string|int} value
   * @param {boolean} add
   * @returns {Mutation}
   */
  static createSetMutation(field, type, value, add=true) {
    console.assert(field && type && value);
    return {
      field,
      value: {
        set: [{
          add,
          value: {
            [type]: value
          }
        }]
      }
    };
  }

  /**
   * Creates a mutation field if the old and new values are different.
   *
   * @param {string} field
   * @param {string} type If null, then set nul value.
   * @param value If null, then set null value.
   * @returns {Mutation}
   */
  static createFieldMutation(field, type=null, value=null) {
    console.assert(field);
    return {
      field,
      value: !type || _.isNil(value) ? {
        null: true
      } : {
        [type]: value
      }
    };
  }

  /**
   * Creates a mutation to add or remove a label.
   * @param {string} label
   * @param set
   * @returns {Mutation}
   */
  static createLabelMutation(label, set=true) {
    console.assert(label);
    return {
      field: 'labels',
      value: {
        set: [{
          add: set === true,
          value: {
            string: label
          }
        }]
      }
    };
  }

  /**
   * Adds the delete label.
   * @returns {Mutation}
   */
  static createDeleteMutation(set=true) {
    return MutationUtil.createLabelMutation('_deleted', set);
  }
}

/**
 * Helper class that manages item mutations.
 * The Mutator is used directly by components to create and update items via a Batch.
 */
export class Mutator {

  /**
   * @return Standard mutation wrapper supplied to redux's combine() method.
   */
  static graphql() {
    return graphql(UpsertItemsMutation, {
      withRef: true,

      options: {
        // http://dev.apollodata.com/core/read-and-write.html#updating-the-cache-after-a-mutation
        // http://dev.apollodata.com/react/api-mutations.html#graphql-mutation-options-update
//      update: (proxy, { data }) => {}
      },

      //
      // Injects a mutator instance into the wrapped components' properties.
      // NOTE: dependencies must previously have been injected into the properties.
      //
      props: ({ ownProps, mutate }) => {
        let { config, idGenerator, analytics } = ownProps;
        return {
          mutator: new Mutator(idGenerator, mutate, config, analytics)
        };
      }
    });
  }

  /**
   * @param idGenerator
   * @param {function} mutate Provided by apollo.
   * @param config
   * @param analytics
   */
  constructor(idGenerator, mutate, config, analytics) {
    console.assert(mutate && idGenerator && config && analytics);
    this._idGenerator = idGenerator;
    this._mutate = mutate;
    this._config = config;
    this._analytics = analytics;
  }

  /**
   * Batch factory.
   * @param bucket
   * @returns {Batch}
   */
  batch(bucket) {
    console.assert(bucket, 'Invalid bucket.');
    let optimistic = _.get(this._config, 'options.optimisticResponse');
    return new Batch(this._idGenerator, this._mutate, bucket, null, optimistic);
  }
}
