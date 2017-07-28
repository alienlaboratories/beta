//
// Copyright 2017 Alien Labs.
//

import { Logger } from 'alien-util';

const logger = Logger.get('sync');

/**
 * Base class for syncers.
 */
export class Syncer {

  constructor(config, database, id) {
    console.assert(config && database && id);
    this._config = config;
    this._database = database;
    this._id = id;
  }

  // TODO(burdon): Store sync state and pass into method.

  async sync(user, attributes) {
    logger.log(`Sync[${this._id}]: ${user.id}`);
    return this.doSync(user, attributes);
  }

  async doSync(user, attributes) {}
}
