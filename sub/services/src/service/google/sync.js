//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';

import { TypeUtil, Logger } from 'alien-util';

import { GoogleOAuthProvider } from './google_oauth';

const logger = Logger.get('google.sync');

/**
 * Base class for Google syncers.
 */
export class GoogleSyncer {

  // TODO(burdon): Base class for syncers (e.g., store state).

  constructor(config, database) {
    console.assert(config && database);
    this._config = config;
    this._database = database;
  }

  async sync(user) {
    // TODO(burdon): Store sync status.
    if (!_.get(user, 'credentials.google.refresh_token')) {
      logger.log('No refresh token for: ' + user.email);
      return;
    }

    let authClient = GoogleOAuthProvider.createAuthClient(
      _.get(this._config, 'google'), _.get(user, 'credentials.google'));

    let tokens = await GoogleOAuthProvider.refreshAccessToken(authClient);
    let { access_token } = tokens;

    // TODO(burdon): Save updated token.
    _.set(user, 'credentials.google.access_token', access_token);

    let items = await this._doSync(user, authClient);
    logger.log('Items:', TypeUtil.stringify(items));
    return items;
  }

  /**
   * Perform sync batch.
   *
   * @param user
   * @param authClient
   * @returns {Promise.<[{Item}]>} Synced items.
   * @private
   */
  // TODO(burdon): Batching? Multiple tasks?
  async _doSync(user, authClient) {
    throw new Error('Not implemented');
  }
}
