//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';

import { Logger } from 'alien-util';
import { GoogleMailSyncer } from 'alien-services';

import { Task } from '../../task';

const logger = Logger.get('google.sync');

/**
 * Sync calendar.
 */
export class GoogleCalendarSyncTask extends Task {

  constructor(config, database, systemStore) {
    super();
    console.assert(config && database && systemStore);
  }

  async execTask(attributes, data) {
//  let { userId } = attributes;
  }
}

/**
 * Sync email.
 */
export class GoogleMailSyncTask extends Task {

  constructor(config, database, systemStore) {
    super();
    console.assert(config && database && systemStore);

    this._database = database;
    this._systemStore = systemStore;
    this._syncer = new GoogleMailSyncer(config, database);
  }

  async execTask(attributes, data) {
    let { userId } = attributes;

    // This is the history of the last message.
//  let { historyId } = data;

    // Do sync.
    let user = await this._systemStore.getUser(userId);

    // TODO(burdon): Generalize Sync task.
    // TODO(burdon): Use const (see also profileRouter).
    let state = _.get(user, 'service.google.mail.sync', {});
    logger.log('Current state:', JSON.stringify(state));
    let { state:newState } = await this._syncer.sync(user, state);

    // Update state.
    _.set(user, 'service.google.mail.sync', newState);
    await this._systemStore.updateUser(user);
    logger.log('Updated state:', JSON.stringify(newState));
  }
}
