//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';

import { Matcher } from './matcher';

/**
 * Schema transformations (client/server).
 * Depends on graphql schema definitions.
 */
export class Transforms {

  // TODO(burdon): Do basic validation (e.g., check scalars are not objects).

  /**
   * Applies the mutations to the given object.
   *
   * @param {{}} context
   * @param {Item} object
   * @param {ObjectMutationInput} mutations
   */
  static applyObjectMutations(context, object, mutations) {
    console.assert(object && mutations);

    _.each(mutations, mutation => {
      Transforms.applyObjectMutation(context, object, mutation);
    });

    return object;
  }

  /**
   * Update object.
   *
   * @param {{}} context
   * @param {Item} object
   * @param {ObjectMutationInput} mutation
   * @returns {*}
   */
  static applyObjectMutation(context, object, mutation) {
    console.assert(object && mutation);
    let { field, value } = mutation;

    // TODO(burdon): Field dot paths (_.set/get).
    // TODO(burdon): Introspect for type-checking (and field name setting).

    // Null.
    if (_.isNil(value) || value.null) {
      delete object[field];
      return object;
    }

    // JSON object.
    if (value.json !== undefined) {
      object[field] = JSON.parse(value.json);
      return object;
    }

    // Map delta.
    if (value.map !== undefined) {
      _.each(value.map, value => {
        object[field] = Transforms.applyMapMutation(context, object[field] || [], value);
      });
      return object;
    }

    // Set delta.
    if (value.set !== undefined) {
      _.each(value.set, value => {
        object[field] = Transforms.applySetMutation(context, object[field] || [], value);
      });
      return object;
    }

    // Array delta.
    if (value.array !== undefined) {
      _.each(value.array, value => {
        object[field] = Transforms.applyArrayMutation(context, object[field] || [], value);
      });
      return object;
    }

    // Object delta.
    if (value.object !== undefined) {
      _.each(value.object, value => {
        object[field] = Transforms.applyObjectMutation(context, object[field] || {}, value);
      });
      return object;
    }

    // Multiple scalar values.
    // NOTE: This overwrites existing values.
    if (value.values) {
      object[field] = _.map(value.values, value => {
        let scalar = Transforms.scalarValue(context, value.value);
        console.assert(scalar !== undefined);
        return scalar;
      });
      return object;
    }

    // Scalars.
    let scalar = Transforms.scalarValue(context, value);
    if (scalar !== undefined) {
      _.set(object, field, scalar);
      return object;
    }

    throw new Error('Invalid mutation: ' + JSON.stringify(mutation));
  }

  // TODO(burdon): When replacing an object value (for a set or array), distinguish between
  // merge and replace (by default replace).

  /**
   * Update map values.
   *
   * NOTE: GraphQL doesn't support maps (i.e., arbitrary keyed objects).
   * Instead we declare arrays of typed objects and use Map mutations to update them.
   * (See comment in the schema document).
   *
   * @param {{}} context
   * @param map
   * @param {MapMutationInput} mutation
   * @returns updated map.
   */
  static applyMapMutation(context, map, mutation) {
    let predicate = mutation.predicate;

    // Find the object to mutate (the object in the array that matches the predicate).
    let key = Transforms.scalarValue(context, predicate.value);
    console.assert(key);
    let idx = _.findIndex(map, v => _.get(v, predicate.key) === key);

    // NOTE: Must be object mutation (which mutates to object matching the predicate).
    let value = mutation.value.object;
    if (value === undefined) {
      if (idx !== -1) {
        // Remove.
        map.splice(idx, 1);
      }
    } else {
      if (idx === -1) {
        // Append.
        map.push(Transforms.applyObjectMutations(context, {
          [predicate.key]: key
        }, value));
      } else {
        // Update.
        Transforms.applyObjectMutations(context, map[idx], value);
      }
    }

    return map;
  }

  /**
   * Update set.
   *
   * @param {{}} context
   * @param set
   * @param {SetMutationInput} mutation
   * @returns updated set.
   */
  static applySetMutation(context, set, mutation) {
    // NOTE: non-scalar sets don't make sense without key.
    let value = Transforms.scalarValue(context, mutation.value);
    console.assert(value !== undefined);

    // Special handling for IDs.
    if (context.client && value.id) {
      console.assert(value.type);

      // Client has vector of resolved objects.
      if (mutation.add === false) {
        _.pullAllBy(set, [value], 'id');
      } else {
        set = _.unionBy(set, [{ __typename: value.type, ...value }], 'id');
      }

      return set;
    }

    if (mutation.add === false) {
      _.pull(set, value);
    } else {
      set = _.union(set, [value]);
    }

    return set;
  }

  /**
   * Update array.
   *
   * @param {{}} context
   * @param array
   * @param {ArrayMutationInput} mutation
   * @returns updated array.
   */
  static applyArrayMutation(context, array, mutation) {
    console.assert(array && mutation);

    // Clip range.
    let idx = Math.min(mutation.index, _.size(array) - 1);

    // Handle JSON object or scalars.
    let value;
    if (mutation.value.json) {
      value = JSON.parse(mutation.value.json);
    } else {
      value = Transforms.scalarValue(context, mutation.value);
    }

    if (value === undefined) {
      array.splice(idx, 1);
    } else {
      if (idx === -1) {
        array.push(value);
      } else {
        array.splice(idx, 0, value);
      }
    }

    return array;
  }

  /**
   * Returns a scalar value.
   * If a key is specified, then:
   * - on the server this is treated as a GUID.
   * - on the client this is converted to a { key } object that will match objects in the Apollo cache.
   *
   * @param context
   * @param value
   * @returns {*}
   */
  static scalarValue(context, value) {
    if (value.key) {
      if (context.client) {
        return { __typename: value.key.type, ...value.key };
      } else {
        return value.key.id;
      }
    }

    return Matcher.scalarValue(value);
  }
}
