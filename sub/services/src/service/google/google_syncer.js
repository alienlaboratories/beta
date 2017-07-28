//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';

import { Syncer } from '../syncer';
import { GoogleOAuthProvider } from './google_oauth';

/**
 * Base class for Google syncers.
 */
export class GoogleSyncer extends Syncer {

  async doSync(user, state) {

    if (!_.get(user, 'credentials.google.refresh_token')) {
      return Promise.reject(`User[${user.id}]: Missing refresh token.`);
    }

    // TODO(burdon): Use constants.
    let authClient = GoogleOAuthProvider.createAuthClient(
      _.get(this._config, 'google'), _.get(user, 'credentials.google'));

    // TODO(burdon): Save updated token.
    let tokens = await GoogleOAuthProvider.refreshAccessToken(authClient).catch(err => {
      return Promise.reject(`User[${user.id}]: Can't refresh token: ${err.message}`);
    });

    let { access_token } = tokens;
    _.set(user, 'credentials.google.access_token', access_token);

    return await this._doSync(authClient, user, state);
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
