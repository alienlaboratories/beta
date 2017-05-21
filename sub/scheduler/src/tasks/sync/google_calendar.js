//
// Copyright 2017 Alien Labs.
//

import { Task } from '../../task';

import { GoogleCalendarClient } from 'alien-services';

/**
 * Sync email.
 */
export class GoogleCalendarSyncTask extends Task {

  constructor(config, database, pushManager) {
    super();

    // TODO(burdon): Factor out.
    this._config = config;
    this._database = database;
    this._pushManager = pushManager;

    // Calendar client.
    this._client = new GoogleCalendarClient();
  }

  async execTask(data) {}
}
