//
// Copyright 2017 Alien Labs.
//

import { MutationUtil } from 'alien-core';

import { Batch } from './batch';

const bucket = 'Group-1';

// Jest:
// https://facebook.github.io/jest/docs/expect.html#tohavelengthnumber

describe('Batch:', () => {

  it('Null batch.', (done) => {
    function mutator(params) {
      expect(_.get(params, 'variables.mutations')).toHaveLength(0);
      done();
    }

    new Batch(mutator, bucket).commit();
  });

  it('Create item.', (done) => {
    function mutator(params) {
      expect(_.get(params, 'variables.mutations')).toHaveLength(1);

      // Auto add bucket and type mutations.
      // TODO(burdon): These should be part of protocol not mutation.
      expect(_.get(params, 'variables.mutations[0].mutations')).toHaveLength(3);
      done();
    }

    new Batch(mutator, bucket)
      .createItem('Task', 'T-1', [
        MutationUtil.createFieldMutation('title', 'string', 'Test')
      ])
      .commit();
  });

  it('Create and insert (with optimistic responses).', (done) => {
    function mutator(params) {
      let { upsertItems } = _.get(params, 'optimisticResponse');
      expect(upsertItems).toHaveLength(2);

      // Check parent has been patched with the inserted item.
      expect(_.get(upsertItems[0], 'id')).toEqual(_.get(upsertItems[1], 'tasks[0].id'));
      done();
    }

    new Batch(mutator, bucket, true)
      .createItem('Task', 'T-1', [
        MutationUtil.createFieldMutation('title', 'string', 'Test')
      ], 'task')
      .updateItem({ id: 'P-1', type: 'Project' }, [
        Batch.ref('task', item => MutationUtil.createSetMutation('tasks', 'id', item.id))
      ])
      .commit();
  });

});
