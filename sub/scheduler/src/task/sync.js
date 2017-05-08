//
// Copyright 2017 Minder Labs.
//

import _ from 'lodash';

import { ErrorUtil, Logger, TypeUtil } from 'alien-util';
import { GoogleMailClient, GoogleOAuthProvider } from 'alien-services';

const logger = Logger.get('sync');

/**
 * Sync email.
 */
export class GmailSyncTask {

  // TODO(burdon): Factor out base class.

  constructor(config, pushManager, systemStore) {
    console.assert(config && pushManager && systemStore);
    this._config = config;
    this._pushManager = pushManager;
    this._systemStore = systemStore;

    // Gmail client.
    this._client = new GoogleMailClient();
  }

  run(data) {
    // TODO(burdon): Should scheduler task for each user.
    return this._systemStore.queryItems({}, {}, { type: 'User' }).then(users => {
      return Promise.all(_.each(users, user => {
        if (!_.get(user, 'credentials.google.refresh_token')) {
          logger.log('No refresh token for: ' + user.email);
        } else {
          logger.log('Syncing: ' + user.email);

          let authClient = GoogleOAuthProvider.createAuthClient(
            _.get(this._config, 'google'), _.get(user, 'credentials.google'));

          authClient.refreshAccessToken((err, tokens) => {
            if (err) {
              throw ErrorUtil.error('sync', err);
            }

            let { access_token } = tokens;

            // TODO(burdon): Save updated token.
            _.set(user, 'credentials.google.access_token', access_token);

            let query = 'label:UNREAD';
            this._client.list(authClient, query, 10).then(results => {
              logger.log(`Results[${user.email}/${query}]:`,
                TypeUtil.stringify(_.map(results, result => _.pick(result, 'from', 'title')), 2));

              // TODO(burdon): Link Messages to Contact.

              // Notify clients.
              // TODO(burdon): Need client store (Hack send in job).
              let client = _.find(_.get(data, 'clients'), client => client.userId === user.id);
              if (client) {
                let { platform, messageToken } = client;
                this._pushManager.sendMessage(platform, messageToken);
              }
            });
          });
        }
      }));
    });
  }
}
