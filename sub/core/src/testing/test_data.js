//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';

import { Database } from '../database';

/**
 * Test data util.
 */
export class TestData {

  // TODO(burdon): Rename DataParser? ImportTool?

  /**
   * @param { items } data
   */
  constructor(data) {
    console.assert(data);

    this._items = data.items;
    this._userId = null;
    this._buckets = [];

    // TODO(burdon): Assumes data has single user.
    _.each(_.get(this._items, Database.NAMESPACE.SYSTEM), item => {
      switch (item.type) {
        case 'Group':
          this._buckets.push(item.id);
          break;

        case 'User':
          console.assert(!this._userId);
          this._userId = item.id;
          break;
      }
    });
  }

  /**
   * Get the context for the default user.
   */
  get context() {
    return {
      userId: this._userId,
      buckets: this._buckets
    };
  }

  /**
   * Get the map of items (by namespace) to initializer the database.
   * @returns {{ namespace: [{Item}] }}
   */
  get itemMap() {
    return this._items;
  }
}
