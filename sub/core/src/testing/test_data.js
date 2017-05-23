//
// Copyright 2017 Alien Labs.
//

import { Database } from '../database';

/**
 * Test data util.
 */
export class TestData {

  constructor(data=TEST_DATA) {
    console.assert(data);
    this._data = data;
  }

  get context() {
    return {
      userId: this.userId,
      buckets: [ this.bucket ]
    };
  }

  get bucket() {
    return this._data.bucket;
  }

  get userId() {
    return this._data.userId;
  }

  get itemMap() {
    return this._data.itemMap;
  }
}

// TODO(burdon): JSON file.

const GROUP_ID = 'G-1';

const USER_ID = 'tester';

const TEST_DATA = {

  userId: USER_ID,

  bucket: GROUP_ID,

  itemMap: {

    [Database.NAMESPACE.SYSTEM]: [
      {
        type: 'Group',
        id: GROUP_ID,
        title: 'Group 1'
      },
      {
        type: 'User',
        id: USER_ID,
        displayName: 'Test User'
      }
    ],

    [Database.NAMESPACE.USER]: [
      {
        bucket: GROUP_ID,
        type: 'Project',
        id: 'P-1',
        title: 'Default Project',
        labels: ['_default'],

        group: {
          id: GROUP_ID,
          title: 'Default Group'
        },

        tasks: ['T-1', 'T-2', 'T-3']
      },

      {
        bucket: GROUP_ID,
        type: 'Task',
        id: 'T-1',
        title: 'Task 1',
      },
      {
        bucket: GROUP_ID,
        type: 'Task',
        id: 'T-2',
        title: 'Task 2',
      },
      {
        bucket: GROUP_ID,
        type: 'Task',
        id: 'T-3',
        title: 'Task 3',
      }
    ]
  }
};
