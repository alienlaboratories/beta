//
// Copyright 2017 Minder Labs.
//

import _ from 'lodash';

import { ErrorUtil, Logger, TypeUtil } from 'alien-util';
import { Database } from 'alien-core';
import { GoogleMailClient, GoogleOAuthProvider } from 'alien-services';

const logger = Logger.get('sync');

/**
 * Sync email.
 */
export class GmailSyncTask {

  // TODO(burdon): Factor out base class.

  constructor(config, database, pushManager) {
    console.assert(config && database && pushManager);
    this._config = config;
    this._database = database;
    this._pushManager = pushManager;

    // Gmail client.
    this._client = new GoogleMailClient();
  }

  run(data) {
    // TODO(burdon): Should scheduler task for each user.
    return this._database.getQueryProcessor(Database.NAMESPACE.SYSTEM)
      .queryItems({}, {}, { type: 'User' }).then(users => {
        return Promise.all(_.each(users, user => {
          if (!_.get(user, 'credentials.google.refresh_token')) {
            logger.log('No refresh token for: ' + user.email);
          } else {
            logger.log('Syncing: ' + user.email);

            let authClient = GoogleOAuthProvider.createAuthClient(
              _.get(this._config, 'google'), _.get(user, 'credentials.google'));

            // Refresh the token.
            authClient.refreshAccessToken((err, tokens) => {
              if (err) {
                throw ErrorUtil.error('sync', err);
              }

              // TODO(burdon): Save updated token.
              let { access_token } = tokens;
              _.set(user, 'credentials.google.access_token', access_token);

              let query = 'label:UNREAD';
              this._client.list(authClient, query, 10).then(messages => {
                logger.log(`Results[${user.email}/${query}]:`,
                  TypeUtil.stringify(_.map(messages, result => _.pick(result, 'from', 'title')), 2));

                // Build map of senders.
                let messagesBySender = new Map();
                _.each(messages, message => {
                  TypeUtil.defaultMap(messagesBySender, message.from, Array).push(message);
                });

                // TODO(burdon): Use aync rather than nesting promises.

                // TODO(burdon): Get Contacts that match From.
                let filter = { type: 'Contact' };
                return this._database.getQueryProcessor(Database.NAMESPACE.USER)
                  .queryItems({}, {}, filter).then(contacts => {

                    let items = [];
                    _.each(contacts, contact => {
                      let messages = messagesBySender.get(contact.email);
                      console.log(contact.email, '======>', messages);
                      if (messages) {
                        // Add messages to contact.
                        contact.messages = _.map(messages, message => {
                          items.push(message);
                          return message.id;
                        });

                        // TODO(burdon): Add to schema.
                        items.push(contact);
                      }
                    });

                    return this._database.getItemStore(Database.NAMESPACE.USER).upsertItems({}, items).then(items => {
                      // Notify clients.
                      // TODO(burdon): Currently ClientStore is in-memory (Hack send in job).
                      let client = _.find(_.get(data, 'clients'), client => client.userId === user.id);
                      if (client) {
                        let { platform, messageToken } = client;
                        this._pushManager.sendMessage(platform, messageToken);
                      }
                    });
                  });
              });
            });
          }
        }));
      });
  }
}
