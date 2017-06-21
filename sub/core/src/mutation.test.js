//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';

import { MutationUtil } from './mutation';
import { Transforms } from './transforms';

test('Clones item', () => {

  let item = {
    id: 'I-1',
    title: 'Test',
    meta: {
      thumbnailUrl: 'http://google.com/avatar.png'
    },
    email: 'test@example.io'
  };

  let keys = {
    'title':              'string',
    'meta.thumbnailUrl':  'string',
    'email':              'string',

    'invalid':            'string'
  };

  let mutations = MutationUtil.cloneItem(item, keys);
  expect(mutations).toHaveLength(3);

  let result = Transforms.applyObjectMutations({}, {}, mutations);
  expect(result).toEqual(_.omit(item, 'id'));
});
