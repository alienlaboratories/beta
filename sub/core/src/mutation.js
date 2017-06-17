//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';

import { Batch } from './batch';
import { LABEL } from './defs';

/**
 * Utils to create mutations.
 */
export class MutationUtil {

  static DEFAULT_ITEM_KEYS = {
    'title':              'string',
    'meta.thumbnailUrl':  'string',
    'email':              'string'
  };

  /**
   * Create mutations to clone the given item.
   *
   * @param {Item} item
   * @param {[{ field:type }]} keys to clone.
   * @return {[Mutation]}
   */
  static cloneItem(item, keys=MutationUtil.DEFAULT_ITEM_KEYS) {
    console.assert(item && keys);
    let mutations = [];

    _.each(keys, (type, key) => {
      let value = _.get(item, key);
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
  static createFieldMutation(field, type=undefined, value=undefined) {
    console.assert(field);

    if (_.isNil(value)) {
      type = 'null';
      value = true;
    } else {
      console.assert(type);
    }

    return {
      field,
      value: {
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
    return MutationUtil.createLabelMutation(LABEL.DELETED, set);
  }
}

/**
 * Helper class that manages item mutations.
 * The Mutator is used directly by components to create and update items via a Batch.
 */
export class Mutator {

  /**
   * Batch factory.
   *
   * @param idGenerator
   * @param {FragmentsMap} fragments
   * @param {[{string}]} refetchQueries
   * @param {function} mutate Provided by apollo.
   * @param config
   */
  constructor(idGenerator, fragments, refetchQueries, mutate, config) {
    console.assert(idGenerator && fragments && refetchQueries && mutate && config);
    this._idGenerator = idGenerator;
    this._fragmentMap = fragments;
    this._refetchQueries = refetchQueries;
    this._mutate = mutate;
    this._config = config;
  }

  /**
   * Batch factory.
   * @param {[{Group}]} groups
   * @param {string} bucket
   * @returns {Batch}
   */
  // TODO(burdon): Should bucket be required?
  batch(groups, bucket=undefined) {
    console.assert(groups);

    // TODO(burdon): Default group?
    if (!bucket) {
      bucket = groups[0].id;
    }

    let options = {
      // TODO(burdon): Inject dynamic options (don't leak entire config here).
      optimistic:     _.get(this._config, 'options.optimisticResponse'),

      fragments:      this._fragmentMap,
      refetchQueries: _.isFunction(this._refetchQueries) ? this._refetchQueries() : this._refetchQueries
    };

    return new Batch(this._idGenerator, this._mutate, bucket, options);
  }
}
