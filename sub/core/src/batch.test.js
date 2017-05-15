//
// Copyright 2017 Alien Labs.
//

import { Batch } from './batch';
import { IdGenerator } from './id';
import { MutationUtil } from './mutations';

const bucket = 'Group-1';

const idGenerator = new IdGenerator();

describe('Batch:', () => {

  it('Null batch.', (done) => {
    function mutator(params) {
      expect(_.get(params, 'variables.mutations')).to.have.lengthOf(0);
      done();
    }

    new Batch(mutator, idGenerator, bucket).commit();
  });

  it('Create item.', (done) => {
    function mutator(params) {
      expect(_.get(params, 'variables.mutations')).to.have.lengthOf(1);

      // Auto add bucket and type mutations.
      // TODO(burdon): These should be part of protocol not mutation.
      expect(_.get(params, 'variables.mutations[0].mutations')).to.have.lengthOf(3);
      done();
    }

    new Batch(mutator, idGenerator, bucket)
      .createItem('Task', [
        MutationUtil.createFieldMutation('title', 'string', 'Test')
      ])
      .commit();
  });

  it('Create and insert (with optimistic responses).', (done) => {
    function mutator(params) {
      let { upsertItems } = _.get(params, 'optimisticResponse');
      expect(upsertItems).to.have.lengthOf(2);

      // Check parent has been patched with the inserted item.
      expect(_.get(upsertItems[0], 'id')).to.eql(_.get(upsertItems[1], 'tasks[0].id'));
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

});
