//
// Copyright 2017 Alien Labs.
//

import { MutationUtil } from './mutations';

test('Clones item', () => {

  let item = {
    id: 'I-1',
    title: 'Test',
    email: 'test@example.io'
  };

  let mutations = MutationUtil.cloneItem(item, { title: 'string', email: 'string' });
  expect(mutations).toHaveLength(2);
});
