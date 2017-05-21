//
// Copyright 2017 Minder Labs.
//

import _ from 'lodash';

import { Logger, TypeUtil } from 'alien-util';
import { Database } from 'alien-core';
import { GoogleMailClient, GoogleOAuthProvider } from 'alien-services';

import { Task } from '../../task';

const logger = Logger.get('sync');

/**
 * Sync email.
 */
export class GoogleMailSyncTask extends Task {

  constructor(config, database, pushManager) {
    super();
    console.assert(config && database && pushManager);

    this._config = config;
    this._database = database;
    this._pushManager = pushManager;

    // Gmail client.
    this._client = new GoogleMailClient();
  }

  // TODO(burdon): Move to service.

  async execTask(data) {

    /**
     * Sync each user.
     */
    let sync = async (user) => {
      if (!_.get(user, 'credentials.google.refresh_token')) {
        logger.log('No refresh token for: ' + user.email);
        return;
      }

      //
      // Get and refresh the user's token.
      //
      let authClient = GoogleOAuthProvider.createAuthClient(
        _.get(this._config, 'google'), _.get(user, 'credentials.google'));
      let tokens = await GoogleOAuthProvider.refreshAccessToken(authClient);
      let { access_token } = tokens;
      // TODO(burdon): Save updated token.
      _.set(user, 'credentials.google.access_token', access_token);

      // TODO(burdon): Store and user sync point.
      let query = 'label:UNREAD';

      //
      // Retrieve messages.
      //
      logger.log('Syncing: ' + user.email);
      let messages = await this._client.list(authClient, query, 10);
      logger.log(`Results[${user.email}/${query}]:`,
        TypeUtil.stringify(_.map(messages, result => _.pick(result, 'from', 'title')), 2));
      if (_.isEmpty(messages)) {
        return;
      }

      // Build map of senders.
      let messagesBySender = new Map();
      _.each(messages, message => {
        TypeUtil.defaultMap(messagesBySender, message.from.address, Array).push(message);
      });
      logger.log('Senders:', JSON.stringify(Array.from(messagesBySender.keys())));

      //
      // TODO(burdon): Need design for default groups.
      // Get the default group.
      //
      let groups = await this._database.getQueryProcessor(Database.NAMESPACE.SYSTEM).getGroups(user.id);
      let group = groups[0];

      // Create the request context.
      let context = { buckets: [group.id] };
      logger.log('Context:', JSON.stringify(context));

      // TODO(burdon): Get only Contacts that match From email address.
      let filter = { type: 'Contact' };
      let contacts = await this._database.getQueryProcessor(Database.NAMESPACE.USER).queryItems(context, {}, filter);
      logger.log('Contacts:', TypeUtil.stringify(contacts));

      //
      // Create list of items (Contacts and Messages) to upsert.
      //
      let items = [];
      _.each(contacts, contact => {
        let messages = messagesBySender.get(contact.email);
        if (!_.isEmpty(messages)) {
          // Add messages to contact.
          contact.messages = _.map(messages, message => {
            // TODO(burdon): Which bucket should this belong to?
            message.bucket = group.id;
            items.push(message);
            return message.id;
          });

          // TODO(burdon): Add to schema.
          items.push(contact);
        }
      });

      logger.log('Items:', TypeUtil.stringify(items));
      if (_.isEmpty(items)) {
        return Promise.resolve();
      }

      //
      // Upsert the items.
      //
      await this._database.getItemStore(Database.NAMESPACE.USER).upsertItems(context, items);

      //
      // Notify clients.
      // TODO(burdon): Factor out notifications.
      // TODO(burdon): Currently ClientStore is in-memory (Hack sends client map as part of the job data).
      //
      let client = _.find(_.get(data, 'clients'), client => client.userId === user.id);
      if (client) {
        let { platform, messageToken } = client;
        this._pushManager.sendMessage(platform, messageToken);
      }
    };

    // TODO(burdon): Pass user ids in task.
    // TODO(burdon): Don't Sync all users.
    let users = await this._database.getQueryProcessor(Database.NAMESPACE.SYSTEM).queryItems({}, {}, { type: 'User' });

    return await _.each(users, user => sync(user));
  }
}
