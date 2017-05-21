//
// Copyright 2017 Alien Labs.
//

import { Database } from '../database';
import { IdGenerator } from '../id';
import { Matcher } from '../matcher';
import { SystemStore } from '../system_store';
import { MemoryItemStore } from '../memory_item_store';

/**
 * Testing utils.
 */
export class TestUtil {

  static createDatabase() {
    let idGenerator = new IdGenerator();
    let matcher = new Matcher();

    let systemStore = new SystemStore(
      new MemoryItemStore(idGenerator, matcher, Database.NAMESPACE.SYSTEM, false));

    let userDataStore =
      new MemoryItemStore(idGenerator, matcher, Database.NAMESPACE.USER, true);

    let database = new Database()
      .registerItemStore(systemStore)
      .registerItemStore(userDataStore)
      .registerQueryProcessor(systemStore)
      .registerQueryProcessor(userDataStore);

    return database;
  }
}
