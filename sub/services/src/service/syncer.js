//
// Copyright 2017 Alien Labs.
//

/**
 * Base class for syncers.
 */
export class Syncer {

  constructor(config, database) {
    console.assert(config && database);
    this._config = config;
    this._database = database;
  }

  // TODO(burdon): Store sync state and pass into method.

  async sync(user) {}
}
