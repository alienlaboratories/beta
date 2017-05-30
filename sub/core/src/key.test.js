//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';

import { Key } from './key';

test('Create and parse key.', () => {
  const KEY = new Key('I:{{type}}:{{id}}');

  let args = { type: 'User', id: '123' };

  let key = KEY.toKey(args);
  expect(key).toEqual('I:User:123');

  let values = KEY.fromKey(key);
  expect(_.isEqual(values, args)).toEqual(true);
});

test('Create wildcard key.', () => {
  const KEY = new Key('I:{{type}}:{{id}}');

  expect(KEY.toKey()).toEqual('I:*:*');
  expect(KEY.toKey({ type: 'User' })).toEqual('I:User:*');
});
