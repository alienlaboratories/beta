//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';

import { Database } from 'alien-core';
import { GoogleMailSyncer } from 'alien-services';

import { Task } from '../../task';

// TODO(burdon): Base class for sync Tasks?

/**
 * Sync calendar.
 */
export class GoogleCalendarSyncTask extends Task {

  constructor(config, database, pushManager) {
    super();
  }

  async execTask(data) {}
}

/**
 * Sync email.
 */
export class GoogleMailSyncTask extends Task {

  constructor(config, database, pushManager) {
    super();

    this._syncer = new GoogleMailSyncer(config, database);
    this._pushManager = pushManager;
  }

  async execTask(data) {

    // TODO(burdon): Factor out notifications (move into store/query layer.)
    async function syncAndNotify(user) {
      await this._syncer.sync(user);

      // Notify clients.
      // TODO(burdon): Currently ClientStore is in-memory (Hack sends client map as part of the job data).
      let clients = _.filter(_.get(data, 'clients'), client => client.userId === user.id);
      await _.map(clients, client => {
        let { platform, messageToken } = client;
        return this._pushManager.sendMessage(platform, messageToken);
      });
    }

    // TODO(burdon): Don't Sync all users.
    // TODO(burdon): Pass user ids in task.
    let users = await this._database.getQueryProcessor(Database.NAMESPACE.SYSTEM).queryItems({}, {}, { type: 'User' });
    await _.map(users, user => syncAndNotify(user));
  }
}
