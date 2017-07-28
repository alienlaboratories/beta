//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';
import moment from 'moment';

/**
 * Type utils.
 */
export class TypeUtil {

  /**
   * UTC timestamp (milliseonds)
   *
   * https://momentjs.com/docs/#/displaying/unix-timestamp-milliseconds
   * https://stackoverflow.com/questions/18724037/datetime-unix-timestamp-contains-milliseconds
   * https://www.ecma-international.org/ecma-262/6.0/#sec-time-values-and-time-range
   * https://en.wikipedia.org/wiki/Unix_time (NOTE: Not Unix time, which is in seconds).
   * https://docs.python.org/2/library/time.html#time.time (NOTE: Python counts in seconds).
   *
   * @return {number} GraphQL Timestamp.
   */
  static timestamp() {
    return moment().valueOf();      // === _.now();
  }

  /**
   * Convert Map ot Object.
   * @param {Map} map
   * @return {Object}
   */
  static mapToObject(map) {
    return _.zipObject(_.toArray(map.keys()), _.toArray(map.values()));
  }

  /**
   * Right-pad given string.
   * @param text
   * @param length
   */
  static pad(text, length) {
    let len = text ? text.length : 0;
    if (len > length) {
      text = text.substring(0, length - 3) + '...';
      len = length;
    }
    return (text || '') + _.repeat(' ', length - len);
  }

  /**
   * Truncate string.
   * @param value
   * @param len Max length (including ellipses).
   * @returns {string}
   */
  static truncate(value, len=32) {
    if (!value) {
      return '';
    }

    if (value.length > len) {
      let mid = Math.floor(len / 2);
      let left = value.substring(0, mid);
      let right = value.substring(value.length - (mid - 5));
      return left + ' ... ' + right;
    }

    return value;
  }

  /**
   * Concise stringify.
   */
  // TODO(burdon): Options (e.g., depth).
  static stringify(json, indent=0, verbose=false) {
    let str = JSON.stringify(json, (key, value) => {
      if (_.isArray(value) && !verbose) {
        return `len(${value.length})`;
      }
      if (_.isString(value)) {
        return TypeUtil.truncate(value, 40);  // Preserve IDs.
      }
      return value;
    }, indent || 0);

    if (indent === false) {
      return str
        .replace(/[/{/}]/g, '')
        .replace(/"/g, '')
        .replace(/,/g, ' ');
    }

    return str;
  }

  /**
   * Return true if value is effectively empty (i.e., undefined, null, [], or {} values).
   * @param value
   */
  static isEmpty(value) {
    return _.isNil(value) || (_.isObject(value) && _.isEmpty(TypeUtil.compact(value)));
  }

  /**
   * Clones simple JSON object.
   * @param obj
   */
  static clone(obj) {
    console.assert(obj);
    // TODO(burdon): Consider _.cloneDeep?
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * Remove empty top-level fields from object.
   * @param {Object} value
   */
  static compact(value) {
    return _.omitBy(value, v => _.isNil(v)    // Null/undefined scalar.
      || (_.isString(v) && _.isEmpty(v))      // Empty string.
      || (_.isObject(v) && _.isEmpty(v)));    // Empty array/object.
  }

  /**
   * Multimap.
   * @param map
   * @param key
   * @param def
   * @returns {*}
   */
  static defaultMap(map, key, def=Map) {
    console.assert(map && key);
    let value = map.get(key);
    if (value === undefined) {
      value = new def();
      map.set(key, value);
    }

    return value;
  }

  /**
   * Appends non-null values to array.
   * @param array
   * @param value Value or array of values.
   */
  static maybeAppend(array, value) {
    if (!_.isEmpty(value)) {
      if (_.isNil(array)) {
        array = [];
      }

      if (_.isArray(value)) {
        _.each(value, v => array.push(v));
      } else {
        array.push(value);
      }
    }

    return array;
  }

  /**
   * Set obj.key = val if val is not null or undefined.
   * Returns the object.
   */
  static maybeSet(obj, path, val) {
    if (!_.isNil(val)) {
      _.set(obj, path, val);
    }
    return obj;
  }

  /**
   * Get value for key or set to default value.
   */
  static getOrSet(obj, key, defaultVal) {
    if (!obj.hasOwnProperty(key)) {
      obj[key] = defaultVal;
    }
    return obj[key];
  }

  /**
   * Iterates the collection sequentially calling the async function for each.
   *
   * @param obj
   * @param {function} f Called for each key x value. (root, value, key/index, path)
   */
  static traverse(obj, f) {
    const t = (obj, f, path='') => {
      if (_.isArray(obj)) {
        //
        // Array
        //

        obj.forEach((value, i) => {
          let p = path + '[' + i + ']';

          // Callback with indexed value.
          if (f(value, i, obj, p) === false) {
            return;
          }

          return t(value, f, p);
        });
      } else if (_.isObject(obj)) {
        //
        // Object
        //

        _.forOwn(obj, (value, key) => {
          let p = path + (path ? '.' : '') + key;

          // Callback with keyed value.
          if (f(value, key, obj, p) === false) {
            return;
          }

          return t(value, f, p);
        });
      }
    };

    return t(obj, f);
  }
}

/**
 * Dynamic value provider.
 */
export class Provider {

  get value() {}
}

/**
 * Dyamically returns the give property from the object.
 * new PropertyProvider({ foo: { bar: 100 } }, 'foo.bar').value === 100;
 */
export class PropertyProvider extends Provider {

  constructor(object, property) {
    super();
    console.assert(object && property);

    this._object = object;
    this._property = property;
  }

  get value() {
    return _.get(this._object, this._property);
  }
}

/**
 * Wraps a read-only object. Allows for dynamic access of values.
 */
export class Wrapper {

  constructor(object) {
    console.assert(object);
    this._object = object;
  }

  value(property, defaultValue) {
    return _.get(this._object, property, defaultValue);
  }
}
