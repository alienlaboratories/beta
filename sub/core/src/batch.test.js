//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';

import { Batch } from './batch';
import { IdGenerator } from './id';
import { MutationUtil } from './mutations';

const bucket = 'Group-1';

const idGenerator = new IdGenerator();

test('Null batch.', (done) => {

  function mutate(args) {
    return new Promise((resolve, reject) => {
      expect(_.get(args, 'variables.itemMutations')).toHaveLength(0);
      done();
    });
  }

  try {
    new Batch(idGenerator, mutate, bucket).commit();
  } catch (err) {
    done.fail(err);
  }
});

test('Create item.', (done) => {

  function mutate(options) {
    return new Promise((resolve, reject) => {
      expect(_.get(options, 'variables.itemMutations')).toHaveLength(1);

      // Auto add bucket and type mutations.
      // TODO(burdon): These should be part of protocol not mutation.
      expect(_.get(options, 'variables.itemMutations[0].mutations')).toHaveLength(3);
      done();
    });
  }

  new Batch(idGenerator, mutate, bucket)
    .createItem('Task', [
      MutationUtil.createFieldMutation('title', 'string', 'Test')
    ])
    .commit();
});

test('Create and insert (with optimistic responses).', (done) => {

  function mutator(options) {
    return new Promise((resolve, reject) => {
      let { upsertItems } = _.get(options, 'optimisticResponse');
      expect(upsertItems).toHaveLength(2);

      // Check parent has been patched with the inserted item.
      expect(_.get(upsertItems[0], 'id')).toEqual(_.get(upsertItems[1], 'tasks[0].id'));
      done();
    });
  }

  new Batch(idGenerator, mutator, bucket, true)
    .createItem('Task', [
      MutationUtil.createFieldMutation('title', 'string', 'Test')
    ], 'task')
    .updateItem({ id: 'P-1', type: 'Project' }, [
      ({ task }) => MutationUtil.createSetMutation('tasks', 'id', task.id)
    ])
    .commit();
});
