//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';
import Random from 'random-seed';

import { TypeUtil } from 'alien-util';

//
// If Node (i.e., not DOM) then augment global functions.
// TODO(burdon): Factor out node/web abstraction layer.
//

// Emulate browser atob and btoa for Node.
if (typeof btoa === 'undefined') {

  global.btoa = function(str) {
    return new Buffer(str).toString('base64');
  };

  global.atob = function(str) {
    return new Buffer(str, 'base64').toString();
  };
}

/**
 * ID Utils.
 */
export class ID {

  // TODO(burdon): GUID: {Namespace/Bucket/Type/ID}
  // Items may be cloned into other Namespaces that reference the original Item (e.g., Google Docs).
  // Items may be moved across Buckets (e.g., transfer of ownership).
  // Types are invariant and should be part of the ID or Key.

  /**
   * ID for Apollo Cache Normalization (i.e., creating a GUID for the Store's index).
   *
   * DO NOT CALL THIS METHOD DRECTLY.
   *
   * http://dev.apollodata.com/react/cache-updates.html#cacheRedirect
   * http://dev.apollodata.com/react/cache-updates.html#dataIdFromObject
   * @param obj Data item.
   * @returns {*}
   */
  static dataIdFromObject(obj) {

    // TODO(burdon): Don't return keys as top-level object (since id confused). Or return nothing from mutation.
    if (obj.__typename === 'Key') {
      return;
    }

    // TODO(burdon): Test matches Item types (see fragment matcher).
    // Determine if cachable object.
    // NOTE: Other objects return __typename so this isn't reliable.
    if (obj.__typename && obj.id) {
      console.assert(!obj.type || obj.type === obj.__typename,
        'Type mismatch:', JSON.stringify(_.pick(obj, '__typename', 'type')));

      return ID.createStoreId({ type: obj.__typename, id: obj.id });
    }
  }

  static createStoreId(obj) {
    console.assert(obj && obj.type && obj.id, 'Invalid key:', obj);
    return obj.type + ':' + obj.id;
  }

  static key(item) {
    console.assert(item.type && item.id, 'Invalid item: ' + JSON.stringify(item));
    return _.pick(item, 'namespace', 'bucket', 'type', 'id');
  }

  static keyEqual(key1, key2) {
    return _.isEqual(key1, key2);
  }

  static keyToString(key) {
    console.assert(key && key.type && key.id);
    let parts = [ key.type, key.id ];
    if (key.bucket) {
      parts.unshift(key.bucket);
    }

    return _.join(parts, '/');
  }

  static stringToKey(str) {
    let parts = str.split('/');
    let id = parts.pop();
    let type = parts.pop();
    let bucket = parts.pop();
    return ID.key({
      bucket, type, id
    });
  }

  /**
   * Encodes the key as a base64 string that can be used as a parmalink.
   * @param { [bucket], type, id } key
   * @returns {string}
   */
  static encodeKey(key) {
    return btoa(ID.keyToString(key));
  }

  /**
   * Decodes the encoded key.
   * @param str
   * @returns {Key}
   */
  static decodeKey(str) {
    return ID.stringToKey(atob(str));
  }

  /**
   * Creates a foreign key.
   * @param item
   * @return {string} or null if the foreign key cannot be created.
   */
  // TODO(burdon): Use Key type in schema.
  static getForeignKey(item) {
    if (item && item.namespace && item.id) {
      return item.namespace + '/' + item.id;
    } else {
      return null;
    }
  }
}

/**
 * Seedable ID generator.
 * NOTE: Use same seed for in-memory datastore testing. With persistent store MUST NOT be constant.
 */
export class IdGenerator {

  /**
   * UTC timestamp (milliseonds)
   * https://en.wikipedia.org/wiki/Unix_time
   * https://docs.python.org/2/library/time.html#time.time (NOTE: Python counts in seconds).
   * http://stackoverflow.com/questions/18724037/datetime-unix-timestamp-contains-milliseconds
   * @return {number} GraphQL Timestamp.
   */
  static timestamp() {
    return _.now();
  }

  // TODO(burdon): Factor out random.
  // TODO(burdon): Ensure consistent with server.
  constructor(seed=undefined) {
    this._random = Random.create(seed);
  }

  /**
   * Unique ID compatible with server.
   * @returns {string}
   */
  createId(prefix=undefined) {
    const s4 = () => {
      return Math.floor(this._random.floatBetween(1, 2) * 0x10000)
        .toString(16)
        .substring(1);
    };

    return (prefix || '') + s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
  }
}
