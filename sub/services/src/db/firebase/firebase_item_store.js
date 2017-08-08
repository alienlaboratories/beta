//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';

import { Logger } from 'alien-util';
import { BaseItemStore } from 'alien-core';

const logger = Logger.get('store.firebase');

/**
 * Item store.
 *
 * https://firebase.google.com/docs/reference/js/firebase.database.Reference
 *
 * /NAMESPACE   /[BUCKET]   /TYPE     /ID     => { Item }
 *
 * /system                  /User     /user-1             System data.
 * /system                  /Group    /group-1
 * /user        /bucket-1   /Task     /task-1             First party data.
 * /google      /bucket-2   /Contact  /contact-1          Third-party data.
 */
export class FirebaseItemStore extends BaseItemStore {

  constructor(idGenerator, matcher, db, namespace, buckets=false) {
    super(idGenerator, matcher, namespace, buckets);

    console.assert(db);
    this._db = db;
  }

  /**
   * https://firebase.google.com/docs/database/web/structure-data
   * Keys must be UTF-8 encoded, can be a maximum of 768 bytes,
   * and cannot contain ., $, #, [, ], /, or ASCII control characters 0-31 or 127.
   */
  key(args=[]) {
    _.each(args, arg => console.assert(!_.isNil(arg), 'Invalid key: ' + JSON.stringify(args)));
    return '/' + this.namespace + '/' + args.join('/');
  }

  /**
   * Return root keys for all buckets accessible to this user.
   * Override if no buckets (i.e., sy
   * stem store).
   * @param context
   * @param type
   * @returns {Array}
   */
  getBucketKeys(context, type=undefined) {
    if (this._buckets) {
      return _.map(_.get(context, 'buckets'), bucket => this.key([bucket]));
    } else {
      return [this.key(_.compact([type]))];
    }
  }

  /**
   * Resets the store.
   */
  clear() {
    return new Promise((resolve, reject) => {
      let ref = this._db.ref(this.key());
      ref.set(null, error => {
        if (error) {
          reject(error);
        } else {
          resolve(this);
        }
      });
    });
  }

  /**
   *
   * @param key
   * @returns {Promise}
   */
  _getValue(key) {
    // https://firebase.google.com/docs/database/web/lists-of-data#sorting_and_filtering_data
    return this._db.ref(key).once('value').then(data => {
      return data.val();
    });
  }

  queryItems(context, root={}, filter={}) {

    // Gather results from all buckets.
    let bucketKeys = this.getBucketKeys(context);
    let promises = _.map(bucketKeys, key => this._getValue(key));
    return Promise.all(promises).then(buckets => {
      let items = [];
      _.each(buckets, typeMap => {
        _.each(typeMap, (itemMap, type) => {
          items = _.concat(items, Object.values(itemMap));
        });
      });

      return this.filterItems(items, context, root, filter);
    });
  }

  getItems(context, type, itemIds) {

    // Gather results frome each bucket.
    if (this._buckets) {
      // TODO(burdon): ID should contain Bucket and Type for direct look-up.
      let bucketKeys = this.getBucketKeys(context, type);
      return Promise.all(_.map(bucketKeys, key => this._getValue(key))).then(buckets => {
        let items = [];
        let itemMap = new Map();
        _.each(buckets, typeMap => {
          _.each(itemIds, itemId => {
            let key = type + '.' + itemId;
            if (!itemMap.get(key)) {
              let item = _.get(typeMap, key);
              if (item) {
                items.push(item);
                itemMap.set(key, item);
              }
            }
          });
        });

        _.each(itemIds, itemId => {
          let key = type + '.' + itemId;
          if (!itemMap.get(key)) {
            console.warn(`Item not found [${JSON.stringify(context.buckets)}]: ${key}`);
          }
        });

        return items;
      });
    } else {
      // TODO(burdon): Multiple key lookup.
      return Promise.all(_.map(itemIds, itemId => this._getValue(this.key([ type, itemId ]))));
    }
  }

  upsertItems(context, items) {
    let promises = [];

    _.each(items, item => {
      this.onUpdate(item);

      // NOTE: Bucket is optional for some stores (e.g., system).
      let { bucket, type, id:itemId } = item;
      console.assert(type && itemId);
      console.assert(this._buckets === !_.isNil(bucket), 'Invalid bucket: ' + bucket);

      promises.push(new Promise((resolve, reject) => {
        let key = this.key(_.compact([ bucket, type, itemId ]));

        // https://firebase.google.com/docs/database/web/read-and-write
        let ref = this._db.ref(key);
        ref.set(_.omitBy(item, value => _.isNil(value)), error => {
          if (error) {
            logger.error('Invalid item: ' + JSON.stringify(item));
            reject(error);
          } else {
            resolve(item);
          }
        });
      }));
    });

    return Promise.all(promises);
  }

  deleteItems(context, type, itemIds) {
    let promises = [];

    _.each(itemIds, itemId => {
      // TODO(burdon): Conservatively delete from all buckets.
      if (this._buckets) {
        _.each(_.get(context, 'buckets'), bucket => {
          let key = this.key(_.compact([ bucket, type, itemId ]));
          promises.push(this._db.ref(key).remove());
        });
      } else {
        let key = this.key(_.compact([ type, itemId ]));
        promises.push(this._db.ref(key).remove());
      }
    });

    return Promise.all(promises);
  }
}
