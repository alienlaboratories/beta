//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';

/**
 * Test data util.
 */
export class TestData {

  static DEFAULT_FILE = './data/data.json';

  constructor(data=TestData.DEFAULT_FILE) {
    console.assert(data);

    this._data = require(data);

    this._userId = null;
    this._buckets = [];

    // TODO(burdon): Assumes data has single user.
    _.each(_.get(this._data, 'items.system'), item => {
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
    return this._data.items;
  }
}
