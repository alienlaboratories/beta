//
// Copyright 2017 Alien Labs.
//

import { ID } from './id';

test('Encode/decode keys.', () => {
  let key1 = { type: 'Task', id: '123' };
  expect(ID.decodeKey(ID.encodeKey(key1))).toEqual(key1);

  let key2 = { bucket: 'abc', type: 'Task', id: '123' };
  expect(ID.decodeKey(ID.encodeKey(key2))).toEqual(key2);

  expect(key1).not.toEqual(key2);
});

test('Key equality.', () => {
  expect(ID.keyEqual({ type: 'Task', id: '100' }, { id: '100', type: 'Task' }));
});
