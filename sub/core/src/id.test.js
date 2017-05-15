//
// Copyright 2017 Alien Labs.
//

import { ID } from './id';

test('Convert between glocal to local IDs', () => {
  let globalId = ID.toGlobalId('User', 'alien');
  let { type, id } = ID.fromGlobalId(globalId);
  expect(type).toEqual('User');
  expect(id).toEqual('alien');
});
