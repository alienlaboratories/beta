//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';

import { Database } from '../database';
import { IdGenerator } from '../id';
import { Matcher } from '../matcher';
import { SystemStore } from '../system_store';
import { MemoryItemStore } from '../memory_item_store';

/**
 * Testing.
 */
export class DatabaseUtil {

  /**
   * Test in-memory database.
   *
   * @returns {Database}
   */
  static createDatabase() {
    let idGenerator = new IdGenerator();
    let matcher = new Matcher();

    let systemStore = new SystemStore(
      new MemoryItemStore(idGenerator, matcher, Database.NAMESPACE.SYSTEM, false));

    let userDataStore =
      new MemoryItemStore(idGenerator, matcher, Database.NAMESPACE.USER, true);

    return new Database()
      .registerItemStore(systemStore)
      .registerItemStore(userDataStore)
      .registerQueryProcessor(systemStore)
      .registerQueryProcessor(userDataStore);
  }

  /**
   * Load test data into the database.
   *
   * @param {Database} database
   * @param {{ userId, bucket }} context
   * @param {{ namespace:[{Item}] }}itemMap
   * @returns {Promise.<{Database}>}
   */
  static async init(database, context, itemMap) {
    await _.map(itemMap, (items, namespace) => {
      return database.getItemStore(namespace).upsertItems(context, items).then(() => database);
    });

    return database;
  }
}
