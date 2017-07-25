//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';
import google from 'googleapis';
import Gmail from 'node-gmail-api';
import sanitize from 'sanitize-html';

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

  static messageRequest(id) {
    return {
      'Content-Type': 'application/http',
      'body': 'GET ' + GoogleApiUtil.API + '/gmail/v1/users/me/messages/' + id + '\n'   // NOTE: "\n" is important.
    };
  }

  constructor() {
    // https://developers.google.com/gmail/api/quickstart/nodejs
    // https://github.com/google/google-api-nodejs-client/tree/master/apis/gmail (Since poorly documented).
    this._mail = google.gmail('v1');
  }

  /**
   * Pub/Sub subscription.
   *
   * @param authClient
   * @param topic
   * @returns {Promise}
   */
  watch(authClient, topic) {
    logger.log('Watch inbox: ' + topic);
    return new Promise((resolve, reject) => {
      let params = {
        auth: authClient,
        userId: 'me',
        resource: {                   // NOTE: Corresponds to request body (undocumented).
          topicName: topic,
          labels: [ 'INBOX' ]
        }
      };

      // NOTE: See source for googleapis module (not documented).
      // https://developers.google.com/gmail/api/v1/reference/users/watch
      // https://developers.google.com/gmail/api/guides/push#watch_request
      // ERROR: Insufficient Permission (if OAuth SCOPE not granted if expired).
      this._mail.users.watch(params, (err, response) => {
        if (err) {
          // ERROR: User not authorized to perform this action.
          // Add `Pub/Sub Publisher` permission for `serviceAccount:gmail-api-push@system.gserviceaccount.com`
          // https://console.cloud.google.com/cloudpubsub/topics
          reject(err.message);
        } else {
          resolve(_.pick(response, [ 'historyId', 'expiration' ]));
        }
      });
    });
  }

  /**
   * Fetches a single page of history.
   */
  history(authClient, startHistoryId, maxResults) {

    const fetcher = (pageToken, pageSize, i) => {

      // https://developers.google.com/gmail/api/v1/reference/users/history/list
      let params = {
        auth: authClient,
        userId: 'me',
        labelId: 'INBOX',
        historyTypes: [
//        'labelAdded',             // TODO(burdon): Monitor labels (ignore DRAFT).
//        'labelRemoved',
          'messageAdded',
//        'messageDeleted'
        ],
        maxResults: pageSize,
        pageToken,
        startHistoryId
      };

      return new Promise((resolve, reject) => {
        this._mail.users.history.list(params, (err, response) => {
          if (err) {
            reject(err.message);
          } else {
            let objects = [];

            let { history, nextPageToken, historyId } = response;
            _.each(history, event => {
              // NOTE: history.messages only contain { id, threadId } and labels changed.
              let { messagesAdded } = event;

              _.each(messagesAdded, messageAdded => {
                let { message } = messageAdded;
                let { labelIds } = message;
                if (_.indexOf(labelIds, 'DRAFT') === -1) {
                  objects.push(message);
                }
              });
            });

            resolve({ nextPageToken, objects, meta: { historyId } });
          }
        });
      });
    };

    // TODO(burdon): Separate method?
    return GoogleApiUtil.request(fetcher, maxResults).then(result => {
      let { objects, meta } = result;

      // Individual GET requests.
      let batchRequests = _.map(objects, message => GoogleMailClient.messageRequest(message.id));
      return GoogleApiUtil.batch(authClient, batchRequests).then(result => {
        let items = [];
        _.each(result, message => {
          let item = GoogleMailClient.parseMessage(message);
          if (item) {
            items.push(item);
          }
        });

        return {
          items,
          meta
        };
      });
    });
  }

  /**
   * Uses third-party API to retrieve messages (and bodies) since Google doesn't implement
   * batch requests (to retrieve payloads after querying for metadata) in the Node API.
   *
   * @param authClient
   * @param query
   * @param maxResults
   * @returns {Promise}
   */
  messages(authClient, query, maxResults) {
    return new Promise((resolve, reject) => {

      // TODO(burdon): Implement paging, historyId.

      // https://github.com/SpiderStrategies/node-gmail-api
      // https://github.com/SpiderStrategies/node-gmail-api/issues/29 [burdon]
      // https://developers.google.com/apis-explorer/#p/gmail/v1/gmail.users.messages.list?userId=me
      let gmail = new Gmail(_.get(authClient, 'credentials.access_token'));

      let messages = [];

      let stream = gmail.messages(query, {
        max: maxResults,
        fields: [ 'historyId', 'internalDate', 'threadId', 'id', 'labelIds', 'snippet', 'payload' ]
      });

      stream.on('data', (message) => {
        let item = GoogleMailClient.parseMessage(message);
        if (item) {
          messages.push(item);
        }
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
   * Parse message to Item.
   *
   * @param message
   * @returns {{namespace: string, type: string, id: *, title, description: *, gmail_labels: *, snippet: *, from: {name, address}, to}}
   */
  static parseMessage(message) {
    let { historyId, internalDate, id, labelIds, snippet, payload } = message;

    // Let Google detect spam.
    // UNREAD, INBOX, IMPORTANT, CATEGORY_PERSONAL, CATEGORY_PROMOTIONS, CATEGORY_UPDATES
    const filterLabelIds = [ 'IMPORTANT', 'SENT' ];
    let match = _.intersection(filterLabelIds, labelIds)
    if (!match.length) {
      logger.log('Skipping', labelIds, snippet);
      return;
    }

    let to = _.chain(payload.headers)
      .filter(header => header.name === 'To')
      .map(i => DataUtil.parseEmail(i.value))
      .value();

    let from = DataUtil.parseEmail(_.find(payload.headers, header => header.name === 'From').value);

    let subject = _.find(payload.headers, header => header.name === 'Subject').value;

    // The payload either contains an array of parts, or a single part that is inside the payload.
    let body;
    _.each(_.get(payload, 'parts', [ payload ]), part => {
      if (body) {
        return;
      }

      let result = GoogleMailClient.parsePart(part);
      body = _.get(result, 'body');
    });

    let item = {
      namespace: NAMESPACE,
      type: 'Message',
      id: id,
      title: subject,
      description: body,
      gmail_labels: labelIds,
      snippet,
      from,
      to
    };

    logger.log(`Message: ${historyId} ${internalDate} [${TypeUtil.truncate(from.address, 32).padEnd(32)}]: ${subject}`);
    return item;
  }

  /**
   * Assumes we're interested in the first part that matches.
   *
   * @param part
   * @returns {{body: *}}
   */
  static parsePart(part) {
    let { headers, body: { data } } = part;

    // Decode map.
    // NOTE: May be multiple values?
    headers = _.mapValues(_.keyBy(headers, 'name'), 'value');

    // TODO(burdon): Strip body. Remove whitespace.

    // Decode content.
    // TODO(burdon): Images, attachments, etc.
    // TODO(burdon): Tokenize snippet and do keyword extraction?
    let body;
    let contentType = headers['Content-Type'].replace(/ /g,'').split(';');
    switch (contentType[0]) {
      case 'text/plain': {
        body = atob(data);
        body = body.replace(/[\n\r]/g, '');
        break;
      }

      // TODO(burdon): Prefer HTML?
      case 'text/html': {
        // https://www.npmjs.com/package/sanitize-html
        // NOTE: https://www.npmjs.com/package/striptags has no deps.
        body = sanitize(atob(data), {
          allowedTags: [ 'a' ],
          allowedAttributes: {
            'a': [ 'href' ]
          }
        });

        body = body.replace(/\n/g, '');
        break;
      }

      case 'multipart/alternative': {
        _.each(part.parts, part => {
          if (body) {
            return;
          }

          body = GoogleMailClient.parsePart(part);
        });
        break;
      }
    }

    return { body };
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

  // https://developers.google.com/gmail/api/guides/sync

  constructor(config, database) {
    super(config, database, 'google.mail');

    // Gmail client.
    this._client = new GoogleMailClient();
  }

  async _doSync(authClient, user, attributes) {
    console.assert(authClient && user && attributes);

    let { historyId } = attributes;

    // TODO(burdon): Store and user sync point.
    // https://developers.google.com/gmail/api/v1/reference/users/history/list (historyId)
    // https://developers.google.com/gmail/api/v1/reference/users/messages/list
    let query = 'label:UNREAD';

    //
    // Retrieve messages.
    //
    logger.log('Syncing: ' + user.email);
    let messages = await this._client.messages(authClient, query, 10);
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
      logger.log('Updating items: ' + _.size(items));
      return this._database.getItemStore(Database.NAMESPACE.USER).upsertItems(context, items);
    }
  }
}
