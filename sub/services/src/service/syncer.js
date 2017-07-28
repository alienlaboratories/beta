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

  async sync(user, state) {
    logger.log(`Sync[${this._id}]: ${user.id} ${JSON.stringify(state)}`);
    return this.doSync(user, state);
  }

  async getState() {}

  async doSync(user, state) {}
}
