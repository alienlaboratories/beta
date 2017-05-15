//
// Copyright 2017 Alien Labs.
//

import { IdGenerator } from './id';
import { Matcher } from './matcher';
import { MemoryItemStore } from './memory_item_store';

import { ItemStoreTests } from './testing/item_store_tests';

const idGenerator = new IdGenerator(1000);

const matcher = new Matcher();

ItemStoreTests(() => {
  return Promise.resolve(new MemoryItemStore(idGenerator, matcher, 'test'));
});
