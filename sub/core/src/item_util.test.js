//
// Copyright 2017 Alien Labs.
//

import { Database } from './database';
import { IdGenerator } from './id';
import { ItemUtil } from './item_util';
import { Matcher } from './matcher';
import { MemoryItemStore } from './memory_item_store';

//
// Database.
//

const idGenerator = new IdGenerator(1000);

const matcher = new Matcher();

const itemStore = new MemoryItemStore(idGenerator, matcher, 'test', false);

let context = {};

test('Groups items.', (done) => {
  let items = [
    {
      id: 'I-1',
      type: 'Task',
      title: 'Task 1',
      project: 'project-1'          // project-1
    },
    {
      id: 'I-2',
      type: 'Task',
      title: 'Task 2'
    },
    {
      id: 'I-3',
      type: 'Note',
      title: 'Note 1'
    },
    {
      id: 'project-1',
      type: 'Project',
      title: 'Project 1'            // project-1
    },
    {
      id: 'I-4',
      type: 'Task',
      title: 'Task 3',
      project: 'project-1'          // project-1
    },
    {
      id: 'I-5',
      type: 'Task',
      title: 'Task 4',
      project: 'project-2'
    },
    {
      id: 'I-6',
      type: 'Task',
      title: 'Task 5',
      project: 'project-3'          // project-3
    },
    {
      id: 'I-7',
      type: 'Task',
      title: 'Task 6',
      project: 'project-3'          // project-3
    }
  ];

  itemStore.upsertItems(context, [

    {
      id: 'project-3',              // project-3
      type: 'Project',
      title: 'Project 3'
    }

  ]).then(() => {
    ItemUtil.groupBy(itemStore, context, items, Database.GROUP_SPECS).then(results => {
      expect(results).toHaveLength(5);
      expect(results[0].id).toEqual('project-1');
      expect(results[0].groups[0].field).toEqual('tasks');
      expect(results[0].groups[0].ids).toHaveLength(2);
      done();
    });
  });
});
