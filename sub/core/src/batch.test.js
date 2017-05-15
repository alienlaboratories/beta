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
  function mutator(args) {
    expect(_.get(args, 'variables.mutations')).toHaveLength(0);
    done();
  }

  try {
    new Batch(mutator, idGenerator, bucket).commit();
  } catch (err) {
    done.fail(err);
  }
});

if (false)
test('Create item.', (done) => {
  function mutator(options) {
    expect(_.get(options, 'variables.mutations')).toHaveLength(1);

    // Auto add bucket and type mutations.
    // TODO(burdon): These should be part of protocol not mutation.
    expect(_.get(options, 'variables.mutations[0].mutations')).toHaveLength(3);
    done();
  }

  new Batch(mutator, idGenerator, bucket)
    .createItem('Task', [
      MutationUtil.createFieldMutation('title', 'string', 'Test')
    ])
    .commit();
});

if (false)
test('Create and insert (with optimistic responses).', (done) => {
  function mutator(options) {
    let { upsertItems } = _.get(options, 'optimisticResponse');
    expect(upsertItems).toHaveLength(2);

    // Check parent has been patched with the inserted item.
    expect(_.get(upsertItems[0], 'id')).toEqual(_.get(upsertItems[1], 'tasks[0].id'));
    done();
  }

  new Batch(mutator, idGenerator, bucket, true)
    .createItem('Task', [
      MutationUtil.createFieldMutation('title', 'string', 'Test')
    ], 'task')
    .updateItem({ id: 'P-1', type: 'Project' }, [
      Batch.ref('task', item => MutationUtil.createSetMutation('tasks', 'id', item.id))
    ])
    .commit();
});
