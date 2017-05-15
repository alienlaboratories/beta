//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';

import { Database, ResultMerger } from './database';
import { IdGenerator } from './id';
import { Matcher } from './matcher';
import { MemoryItemStore } from './memory_item_store';

//
// ResultMerger
//

const idGenerator = new IdGenerator(1000);

const matcher = new Matcher();

const context = {};

/**
 * Creates a ResultMerger with query processors with the given items.
 * 
 * @param namespace
 * @param items Items to insert.
 */
function createResultMerger(namespace=Database.NAMESPACE.USER, items=[]) {
  let itemStore = new MemoryItemStore(idGenerator, matcher, namespace, false);
  
  let queryProcessors = new Map();
  queryProcessors.set(namespace, itemStore);

  return itemStore.upsertItems(context, items).then(() => {
    return new ResultMerger(queryProcessors);
  });
}

test('Does not merge results without matching keys', () => {

  const results = [
    {
      namespace: Database.NAMESPACE.USER,
      items: [
        {
          id: 'I-1',
          type: 'Task',
          title: 'Task 1',
          project: 'project-1'                // project-1
        }
      ]
    },
    {
      namespace: 'test_namespace_1',
      items: [
        {
          id: 'I-2',
          type: 'Task',
          title: 'Task 1',
          project: 'project-1'                // project-1
        }
      ]
    }
  ];

  return createResultMerger().then(resultMerger => {
    return resultMerger.mergeResults(results, context).then(items => {
      expect(items).toHaveLength(2);
    });
  });
});

test('Merges results with matching foreign keys', () => {

  const results = [
    {
      namespace: Database.NAMESPACE.USER,
      items: [
        {
          id: 'I-1',
          type: 'Task',
          title: 'Task 1',
          fkey: 'test.com/foreign_key_1'
        }
      ]
    },
    {
      namespace: 'test.com',
      items: [
        {
          id: 'foreign_key_1',
          namespace: 'test.com',
          type: 'Task',
          title: 'Task 1',
          project: 'project-1'                // project-1
        }
      ]
    }
  ];

  return createResultMerger().then(resultMerger => {
    return resultMerger.mergeResults(results, context).then(items => {
      expect(items).toHaveLength(1);
      expect(_.get(items[0], 'project')).toEqual('project-1');
    });
  });
});

test('Does NOT merge user-space result with User store', () => {

  // We don't need to merge in this case -- if there's a USER-namespace result,
  // then presumably it's complete and we don't need to re-fetch the item from the UserStore.

  const items = [
    {
      id: 'I-1',
      type: 'Task',
      title: 'Task 1',
      fkey: 'test.com/foreign_key_1',
      project: 'project-1'                    // Extra info not in the result.
    }
  ];

  const results = [
    {
      namespace: Database.NAMESPACE.USER,
      items: [
        {
          id: 'I-1',
          type: 'Task',
          title: 'Task 1',
          fkey: 'test.com/foreign_key_1'
        }
      ]
    }
  ];

  return createResultMerger(Database.NAMESPACE.USER, items).then(resultMerger => {
    return resultMerger.mergeResults(results, context).then(items => {
      expect(items).toHaveLength(1);

      // Extra info is NOT merged.
      expect(_.get(items[0], 'project')).toEqual(undefined);
    });
  });
});

test('Merges external result with User store', () => {

  const items = [
    {
      id: 'I-1',
      type: 'Task',
      title: 'Task 1',
      fkey: 'test.com/foreign_key_1',
      project: 'project-1'                    // Extra info not in the result.
    }
  ];

  const results = [
    {
      namespace: 'test.com',
      items: [
        {
          id: 'foreign_key_1',
          namespace: 'test.com',
          type: 'Task',
          title: 'Task 1',
        }
      ]
    }
  ];

  return createResultMerger(Database.NAMESPACE.USER, items).then(resultMerger => {
    return resultMerger.mergeResults(results, context).then(items => {
      expect(items).toHaveLength(1);
      expect(_.get(items[0], 'project')).toEqual('project-1');

      // Merged items with fkey shouldn't have a namespace anymore.
      expect(_.get(items[0], 'namespace')).toEqual(undefined);
      expect(_.get(items[0], 'fkey')).toEqual('test.com/foreign_key_1');
    });
  });
});

test('Merges results from 3 sources', () => {

  const items = [
    {
      id: 'I-1',
      type: 'Task',
      title: 'Task 1',
      fkey: 'test.com/foreign_key_1',
      description: 'A task'                   // Extra info not in the results.
    }
  ];

  const results = [
    {
      namespace: Database.NAMESPACE.USER,
      items: [
        {
          id: 'I-1',
          type: 'Task',
          title: 'Task 1',
          fkey: 'test.com/foreign_key_1'
        }
      ]
    },
    {
      namespace: 'test.com',
      items: [
        {
          id: 'foreign_key_1',
          namespace: 'test.com',
          type: 'Task',
          title: 'Task 1',
          project: 'project-1'                // project-1
        }
      ]
    }
  ];

  return createResultMerger(Database.NAMESPACE.USER, items).then(resultMerger => {
    return resultMerger.mergeResults(results, context).then(items => {
      expect(items).toHaveLength(1);
      expect(_.get(items[0], 'project')).toEqual('project-1');
      expect(_.get(items[0], 'description')).toEqual('A task');
      expect(_.get(items[0], 'namespace')).toEqual(undefined);
      expect(_.get(items[0], 'fkey')).toEqual('test.com/foreign_key_1');

      // TODO(madadam): another test w/ conflicting fields, which wins (store or external result)?
    });
  });
});

test('Keeps external results that have no matching foreign key', () => {

  const items = [
    {
      id: 'I-1',
      type: 'Task',
      title: 'Task 1',
      fkey: 'test.com/foreign_key_1',
      project: 'project-1'                    // Extra info not in the result.
    }
  ];

  const results = [
    {
      namespace: Database.NAMESPACE.USER,
      items: [
        {
          id: 'I-1',
          type: 'Task',
          title: 'Task 1',
          fkey: 'test.com/foreign_key_1'
        }
      ]
    },
    {
      namespace: 'test.com',
      items: [
        {
          id: 'foreign_key_1',
          namespace: 'test.com',
          type: 'Task',
          title: 'Task 1',
          project: 'project-1'                // project-1
        },
        {
          id: 'foreign_key_2',
          namespace: 'test.com',
          type: 'Task',
          title: 'Task 2'
        }
      ]
    }
  ];

  return createResultMerger(Database.NAMESPACE.USER, items).then(resultMerger => {
    return resultMerger.mergeResults(results, context).then(items => {
      expect(items).toHaveLength(2);
    });
  });
});
