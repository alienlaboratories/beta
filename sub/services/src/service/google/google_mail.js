//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';
import google from 'googleapis';
import Gmail from 'node-gmail-api';

import { Database } from 'alien-core';
import { ErrorUtil, Logger, TypeUtil } from 'alien-util';

import { DataUtil } from '../../util/data';
import { OAuthServiceProvider } from '../service';

import { GoogleSyncer } from './google_syncer';
import { GoogleApiUtil } from './util';

const NAMESPACE = 'google.com/mail';

const logger = Logger.get('google.mail');

/**
 * Google Mail API wrapper.
 *
 * https://developers.google.com/gmail/api/v1/reference
 */
export class GoogleMailClient {

  constructor() {
    // https://developers.google.com/gmail/api/quickstart/nodejs
    this._mail = google.gmail('v1');
  }

  list(authClient, query, maxResults) {
    return new Promise((resolve, reject) => {

      // https://github.com/SpiderStrategies/node-gmail-api
      // https://github.com/SpiderStrategies/node-gmail-api/issues/29 [burdon]
      // https://developers.google.com/apis-explorer/#p/gmail/v1/gmail.users.messages.list?userId=me
      let gmail = new Gmail(_.get(authClient, 'credentials.access_token'));
      let stream = gmail.messages(query, { max: maxResults, fields: ['id', 'labelIds', 'snippet', 'payload'] });

      // TODO(burdon): Extract email.
      // TODO(burdon): Tokenize snippet and do keyword extraction.
      // TODO(burdon): To/From linking.
      // TODO(burdon): To/From ranking.

      let messages = [];

      stream.on('data', (message) => {
        let { id, labelIds, snippet, payload } = message;

        let to = _.chain(payload.headers)
          .filter(header => header.name === 'To')
          .map(i => DataUtil.parseEmail(i.value))
          .value();

        let from = DataUtil.parseEmail(_.find(payload.headers, header => header.name === 'From').value);

        let subject = _.find(payload.headers, header => header.name === 'Subject').value;

        let item = {
          namespace: NAMESPACE,
          type: 'Message',
          id: id,
          title: subject,
          gmail_labels: labelIds,
          snippet,
          from,
          to
        };

        messages.push(item);
      });

      stream.on('error', (err) => {
        reject(ErrorUtil.message(err));
      });

      stream.on('finish', () => {
        // TODO(burdon): Doesn't exit.
        // https://github.com/SpiderStrategies/node-gmail-api/issues/30 [burdon]
        resolve(messages);
      });
    });
  }

  /**
   * Get list of documents matching the query.
   *
   * @param {google.auth.OAuth2} authClient
   * @param query
   * @param maxResults
   * @returns {Promise.<{Item}>}
   */
  listIds(authClient, query, maxResults) {
    logger.log(`Query(${maxResults}): <${query}>`);
    return GoogleApiUtil.request(this._list.bind(this, authClient, query), maxResults).then(items => {
      logger.log('Results: ' + items.length);
      return _.map(items, item => GoogleMailClient.toItem(item));
    });

    // TODO(burdon): Batch getting messages.
    // https://developers.google.com/api-client-library/javascript/features/batch
  }

  /**
   * Fetches a single page of results.
   */
  _list(authClient, query, pageSize, pageToken, num) {
    logger.log(`Page(${num}): ${pageSize}`);

    return new Promise((resolve, reject) => {

      // TODO(burdon): See framework gmail.py
      // https://www.npmjs.com/package/node-gmail-api
      // https://github.com/pradeep-mishra/google-batch/blob/master/index.js
      // TODO(burdon): Match labelIds and sync query within tokens.
      // https://developers.google.com/gmail/api/v1/reference/users/messages/list
      // https://developers.google.com/apis-explorer/#p/gmail/v1/gmail.users.messages.list?userId=me
      // https://developers.google.com/gmail/api/guides/sync
      let params = {
        auth: authClient,
        userId: 'me',
        pageSize,
        pageToken
      };

      this._mail.users.messages.list(params, (err, response) => {
        if (err) {
          reject(err.message);
        } else {
          resolve({
            items: response.messages,
            nextPageToken: response.nextPageToken
          });
        }
      });
    });
  }

  /**
   * Convert Drive result to a schema object Item.
   */
  static toItem(message) {
    let item = {
      namespace: NAMESPACE,
      type: 'Message',
      id: message.id,
      title: message.subject
    };

    return item;
  }
}

/**
 * Google Mail Service provider.
 */
export class GoogleMailServiceProvider extends OAuthServiceProvider {

  static SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly'
  ];

  constructor(authProvider) {
    super(authProvider, NAMESPACE, GoogleMailServiceProvider.SCOPES);
  }

  get meta() {
    return {
      title: 'Gmail',
      class: 'service-google-mail'
    };
  }
}

/**
 * Google Mail Syncer.
 */
export class GoogleMailSyncer extends GoogleSyncer {

  constructor(config, database) {
    super(config, database);

    // Gmail client.
    this._client = new GoogleMailClient();
  }

  async _doSync(user, authClient) {

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

    //
    // Upsert the items.
    //

    if (!_.isEmpty(items)) {
      return this._database.getItemStore(Database.NAMESPACE.USER).upsertItems(context, items);
    }
  }
}
