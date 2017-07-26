//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';

import { TypeUtil, Logger } from 'alien-util';

import { Syncer } from '../syncer';
import { GoogleOAuthProvider } from './google_oauth';

const logger = Logger.get('google.sync');

/**
 * Base class for Google syncers.
 */
export class GoogleSyncer extends Syncer {

  async doSync(user, attributes) {

    // TODO(burdon): Store sync status.
    if (!_.get(user, 'credentials.google.refresh_token')) {
      return Promise.reject(`User[${user.id}]: Missing refresh token.`);
    }

    let authClient = GoogleOAuthProvider.createAuthClient(
      _.get(this._config, 'google'), _.get(user, 'credentials.google'));

    let tokens = await GoogleOAuthProvider.refreshAccessToken(authClient).catch(err => {
      return Promise.reject(`User[${user.id}]: Can't refresh token: ${err.message}`);
    });

    // TODO(burdon): Save updated token.
    let { access_token } = tokens;
    _.set(user, 'credentials.google.access_token', access_token);

    let items = await this._doSync(authClient, user, attributes);
    logger.log('Items:', TypeUtil.stringify(items));
    return items;
  }

  /**
   * Perform sync batch.
   *
   * @param authClient
   * @param user
   * @param attributes
   * @returns {Promise.<[{Item}]>} Synced items.
   * @private
   */
  async _doSync(authClient, user, attributes) {
    throw new Error('Not implemented');
  }
}
