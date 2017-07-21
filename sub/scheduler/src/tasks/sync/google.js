//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';

import { Database } from 'alien-core';
import { GoogleMailSyncer } from 'alien-services';
import { Logger } from 'alien-util';

import { Task } from '../../task';

const logger = Logger.get('google.mail');

// TODO(burdon): Base class for sync Tasks?

/**
 * Sync calendar.
 */
export class GoogleCalendarSyncTask extends Task {

  constructor(config, database, pushManager) {
    super();
  }

  async execTask(attributes, data) {}
}

/**
 * Sync email.
 */
export class GoogleMailSyncTask extends Task {

  constructor(config, database, pushManager) {
    super();
    console.assert(config && database && pushManager);

    this._database = database;
    this._pushManager = pushManager;
    this._syncer = new GoogleMailSyncer(config, database);
  }

  async execTask(attributes, data) {
    let { userId } = attributes;
    let { historyId } = data;

    // TODO(burdon): Pass userId (not email address).
    // TODO(burdon): Use historyId.
    logger.log('Sync:', userId, historyId);

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
