//
// Copyright 2017 Alien Labs.
//

import { GoogleMailSyncer } from 'alien-services';

import { Task } from '../../task';

/**
 * Sync calendar.
 */
export class GoogleCalendarSyncTask extends Task {

  constructor(config, database, systemStore, pushManager) {
    super();
    console.assert(config && database && systemStore && pushManager);
  }

  async execTask(attributes, data) {
//  let { userId } = attributes;
  }
}

/**
 * Sync email.
 */
export class GoogleMailSyncTask extends Task {

  constructor(config, database, systemStore, pushManager) {
    super();
    console.assert(config && database && systemStore && pushManager);

    this._database = database;
    this._systemStore = systemStore;
    this._pushManager = pushManager;
    this._syncer = new GoogleMailSyncer(config, database);
  }

  async execTask(attributes, data) {
    let { userId } = attributes;

    // This is the current end-point.
//  let { historyId } = data;

    // Do sync.
    let user = await this._systemStore.getUser(userId);

    // TODO(burdon): Generalize Sync task.
    // TODO(burdon): Use const (see also profileRouter).
    let state = _.get(user, 'service.google_com.mail.sync', {});
    let newState = await this._syncer.sync(user, state);

    // Update state.
    _.set(user, 'service.google_com.mail.sync', newState);
    await this._systemStore.updateUser(user);

    // Notify clients.
    // TODO(burdon): Factor out notifications (move into store/query layer.)
    // TODO(burdon): Currently ClientStore is in-memory (Hack sends client map as part of the job data).
    /*
    let clients = _.filter(_.get(data, 'clients'), client => client.userId === user.id);
    await _.map(clients, client => {
      let { platform, messageToken } = client;
      return this._pushManager.sendMessage(platform, messageToken);
    });
    */
  }
}
