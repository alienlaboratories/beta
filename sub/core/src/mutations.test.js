//
// Copyright 2017 Alien Labs.
//

import { MutationUtil } from './mutations';

test('Clones item', () => {

  let item = {
    id: 'I-1',
    title: 'Test'
  };

  let mutations = MutationUtil.cloneItem('test', item);
  expect(mutations).toHaveLength(1);
});
