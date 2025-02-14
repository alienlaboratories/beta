//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';

import { TypeUtil } from 'alien-util';

import { BaseItemStore } from './item_store';

/**
 * In-memory database.
 */
export class MemoryItemStore extends BaseItemStore {

  constructor(idGenerator, matcher, namespace, buckets=true) {
    super(idGenerator, matcher, namespace, buckets);

    // Item stored by key.
    this._items = new Map();
  }

  toString() {
    return `MemoryItemStore(${this._items.size})`;
  }

  dump() {
    return Promise.resolve({
      info: this.toString(),
      items: TypeUtil.mapToObject(this._items)
    });
  }

  key({ bucket, type, id }) {
    console.assert(bucket || !this._buckets, 'Invalid bucket for item: ' + id);

    return _.compact([bucket, type, id]).join('/');
  }

  getBucketKeys(context, type) {
    if (this._buckets) {
      return _.map(_.get(context, 'buckets'), bucket => this.key({ bucket, type }));
    } else {
      console.assert(type);
      return [this.key({ type })];
    }
  }

  queryItems(context, root={}, filter={}) {
    console.assert(context && root && filter);

    // Gather results for all buckets.
    let bucketItems = [];
    if (this._buckets) {
      let bucketKeys = this.getBucketKeys(context);
      this._items.forEach((item, key) => {
        _.each(bucketKeys, bucketKey => {
          if (key.startsWith(bucketKey)) {
            bucketItems.push(item);
            return false;
          }
        });
      });
    } else {
      bucketItems = _.toArray(this._items.values());
    }

    let items = this.filterItems(bucketItems, context, root, filter);
    return Promise.resolve(_.map(items, item => TypeUtil.clone(item)));
  }

  getItems(context, type, itemIds=[]) {
    console.assert(context && type && itemIds);

    // Check all buckets.
    let items = [];
    _.each(this.getBucketKeys(context, type), bucketId => {
      TypeUtil.maybeAppend(items, _.compact(_.map(itemIds, itemId => this._items.get(bucketId + '/' + itemId))));
    });

    return Promise.resolve(_.map(items, item => TypeUtil.clone(item)));
  }

  upsertItems(context, items) {
    console.assert(context && items);

    return Promise.resolve(_.map(items, item => {
      console.assert(!this._buckets || item.bucket, 'Invalid bucket: ' + TypeUtil.stringify(item, 2));

      let clonedItem = this.onUpdate(TypeUtil.clone(item));
      let key = this.key(clonedItem);
      this._items.set(key, clonedItem);
      return clonedItem;
    }));
  }

  deleteItems(context, type, itemIds) {
    console.assert(context && type && itemIds);

    _.each(this.getBucketKeys(context, type), bucketId => {
      _.each(itemIds, itemId => {
        this._items.delete(bucketId + '/' + itemId);
      });
    });

    return Promise.resolve([]);
  }

  /**
   * Reset the store, for debugging.
   */
  clear() {
    this._items = new Map();
    return Promise.resolve();
  }
}
