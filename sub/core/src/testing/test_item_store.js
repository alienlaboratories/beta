//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';

import { Async } from 'alien-util';

import { ItemStore } from '../item_store';

/**
 * Dispatching item store with delayed dispatching.
 */
export class TestItemStore extends ItemStore {

  // TODO(burdon): Random delay.
  // TODO(burdon): Random 500s (retry).

  constructor(itemStore, options) {
    super(itemStore.namespace);
    console.assert(itemStore);
    this._itemStore = itemStore;
    this._options = _.defaults({}, options, {
      delay: 2000
    });
  }

  dump() {
    return this._itemStore.dump();
  }

  queryItems(context, root={}, filter={}) {
    return Async.timeout(this._options.delay).then(() => {
      return this._itemStore.queryItems(context, root, filter);
    });
  }

  getItems(context, type, itemIds) {
    return Async.timeout(this._options.delay).then(() => {
      return this._itemStore.getItems(context, type, itemIds);
    });
  }

  upsertItems(context, items) {
    return Async.timeout(this._options.delay).then(() => {
      return this._itemStore.upsertItems(context, items);
    });
  }

  clear() {
    this._itemStore.clear && this._itemStore.clear();
  }
}
