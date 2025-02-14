//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';
import bluebird from 'bluebird';
import redis from 'redis';

import { BaseItemStore, Key } from 'alien-core';

// https://github.com/NodeRedis/node_redis#promises
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

/**
 * Redis Item Store.
 *
 * Items are stored as JSON serialized strings by Key.
 *
 * https://github.com/NodeRedis/node_redis
 * https://redis.io/commands
 */
export class RedisItemStore extends BaseItemStore {

  // TODO(burdon): PubSub demo (and Mutation Processor).

  // https://github.com/NodeRedis/node_redis#rediscreateclient
  static client(options) {
    let { db } = options;
    return redis.createClient({ db });
  }

  constructor(idGenerator, matcher, client, namespace) {
    super(idGenerator, matcher, namespace);

    this._key = new Key(`I:${namespace}:{{bucket}}:{{type}}:{{itemId}}`);

    console.assert(client);
    this._client = client;
  }

  clear() {
    this._client.flushdb();
  }

  getBucketKeys(context) {
    return _.map(_.get(context, 'buckets'), bucket => this._key.toKey({ bucket }));
  }

  //
  // QueryProcessor interface.
  //

  queryItems(context, root={}, filter={}) {

    // Gather results for each bucket.
    let promises = _.map(this.getBucketKeys(context), key => this._client.keysAsync(key));

    // Get all keys.
    // TODO(burdon): Eventually get keys from Elasticsearch.
    return Promise.all(promises).then(sets => {
      let keys = _.flatten(_.concat(sets));
      if (_.isEmpty(keys)) {
        return [];
      }

      // Get all items.
      return this._client.mgetAsync(keys)
        .then(values => {
          let items = _.map(values, value => JSON.parse(value));
          return this.filterItems(items, context, root, filter);
        });
    });
  }

  //
  // ItemStore interface.
  //

  getItems(context, type, itemIds=[]) {

    // TODO(burdon): Either the ID needs to contain the bucket (pref), or a separate ID => bucket index is maintained.
    // let keys = _.map(itemIds, itemId => this._key.toKey({ bucket, type, itemId }));
    // return this._client.mgetAsync(keys).then(values => _.map(values, value => {
    //   return JSON.parse(value);
    // }));

    throw new Error('Not implemented');
  }

  upsertItems(context, items) {
    return Promise.resolve(_.map(items, item => {
      this.onUpdate(item);

      let { bucket, type, id:itemId } = item;
      let key = this._key.toKey({ bucket, type, itemId });
      this._client.set(key, JSON.stringify(item));

      return item;
    }));
  }
}
