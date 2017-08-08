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
import { ServiceProvider } from '../service';

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
      return GoogleApiUtil.promisify(callback => {

        // https://developers.google.com/gmail/api/v1/reference/users/history/list
        let params = {
          auth: authClient,
          userId: 'me',
          labelId: 'INBOX',
          historyTypes: [
//          'labelAdded',             // TODO(burdon): Monitor labels (ignore DRAFT).
//          'labelRemoved',
            'messageAdded',
//          'messageDeleted'
          ],
          maxResults: pageSize,
          pageToken,
          startHistoryId
        };

        this._mail.users.history.list(params, callback);
      }).then(response => {
        let { nextPageToken, historyId, history } = response;

        let objects = [];
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

        return { nextPageToken, state: { historyId }, objects };
      });
    };

    // TODO(burdon): Separate method?
    return GoogleApiUtil.request(fetcher, maxResults).then(result => {
      let { objects, state } = result;
      let { historyId } = state;

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
          historyId,
          items
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
      let historyId;

      // https://github.com/SpiderStrategies/node-gmail-api
      // https://github.com/SpiderStrategies/node-gmail-api/issues/29 [burdon]
      // https://developers.google.com/apis-explorer/#p/gmail/v1/gmail.users.messages.list?userId=me
      let gmail = new Gmail(_.get(authClient, 'credentials.access_token'));

      let items = [];

      let stream = gmail.messages(query, {
        max: maxResults,
        fields: [ 'historyId', 'internalDate', 'threadId', 'id', 'labelIds', 'snippet', 'payload' ]
      });

      stream.on('data', (message) => {
        historyId = message.historyId;
        let item = GoogleMailClient.parseMessage(message);
        if (item) {
          items.push(item);
        }
      });

      stream.on('error', (err) => {
        reject(ErrorUtil.message(err));
      });

      stream.on('finish', () => {
        // TODO(burdon): Doesn't exit?
        // https://github.com/SpiderStrategies/node-gmail-api/issues/30 [burdon]
        resolve({
          historyId,
          items
        });
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
    // UNREAD, INBOX, IMPORTANT, CATEGORY_PERSONAL, CATEGORY_PROMOTIONS, CATEGORY_UPDATES, CATEGORY_FORUMS
    let match = _.intersection(labelIds, [ 'CATEGORY_PERSONAL', 'IMPORTANT', 'SENT' ]);
    let exclude = _.intersection(labelIds, [ 'CATEGORY_PROMOTIONS', 'CATEGORY_UPDATES', 'CATEGORY_FORUMS' ]);
    if (!match.length || exclude.length) {
      logger.log('Skipping', labelIds, snippet);
      return;
    }

    let to = _.chain(payload.headers)
      .filter(header => header.name === 'To')
      .map(i => DataUtil.parseEmail(i.value))
      .value();

    let from = DataUtil.parseEmail(_.find(payload.headers, header => header.name === 'From').value);

    let subject = (_.find(payload.headers, header => header.name === 'Subject') || { value: snippet }).value;

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
export class GoogleMailServiceProvider extends ServiceProvider {

  static SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly'
  ];

  constructor(authProvider) {
    super(NAMESPACE, authProvider, GoogleMailServiceProvider.SCOPES);
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
    super(config, database, NAMESPACE);

    // Gmail client.
    this._client = new GoogleMailClient();
  }

  async _doSync(authClient, user, state) {
    console.assert(authClient && user && state);
    let { historyId:currentHistoryId } = state;

    //
    // Retrieve messages.
    //

    let result;
    if (currentHistoryId) {
      // Called on notification.
      logger.log(`Syncing[${user.email}]: ${currentHistoryId}`);
      result = await this._client.history(authClient, currentHistoryId);
    } else {
      // Called if no sync state.
      let query = 'label:UNREAD';
      logger.log(`Syncing[${user.email}]: ${query}`);
      result = await this._client.messages(authClient, query, 10);
    }

    logger.log(`Result[${user.email}]:`, TypeUtil.stringify(result));
    let { items, historyId } = result;

    //
    // Process.
    //

    await this._processMessages(user, items);

    return {
      state: { historyId }
    };
  }

  async _processMessages(user, messages) {
    logger.log('Processing: ', TypeUtil.stringify({ messages }));

    //
    // Build map of senders.
    //

    let messagesBySender = new Map();
    _.each(messages, message => {
      TypeUtil.defaultMap(messagesBySender, message.from.address, Array).push(message);
    });

    // Get the default group.
    // TODO(burdon): Need design for default groups.
    // TODO(burdon): This becomes unstable if multiple groups.
    let groups = await this._database.getQueryProcessor(Database.NAMESPACE.SYSTEM).getGroups(user.id);
    let group = groups[0];
    let context = { buckets: [ group.id ] };
    logger.log('Context: ', JSON.stringify(context));

    //
    // Query for contacts.
    //

    // TODO(burdon): Currently only Contacts that match the From email address.
    let filter = { type: 'Contact' };
    let contacts = await this._database.getQueryProcessor(Database.NAMESPACE.USER).queryItems(context, {}, filter);
    logger.log('Contacts:', _.map(contacts, contact => contact.title));

    //
    // Create list of items (Contacts and Messages) to upsert.
    //

    let upsertItems = [];
    _.each(contacts, contact => {
      let messages = messagesBySender.get(contact.email);
      if (!_.isEmpty(messages)) {
        if (!contact.messages) {
          contact.messages = [];
        }

        // Add unique messages.
        _.each(messages, message => {
          // TODO(burdon): Which bucket should this belong to?
          message.bucket = group.id;

          // TODO(burdon): Test unique?
          upsertItems.push(message);
          if (_.indexOf(contact.messages, message.id) === -1) {
            contact.messages.unshift(message.id);
          }
        });

        // TODO(burdon): Add to schema.
        upsertItems.push(contact);
      }
    });

    //
    // Upsert the items.
    //

    if (!_.isEmpty(upsertItems)) {
      logger.log('Updating items: ' + _.size(upsertItems));
      await this._database.getItemStore(Database.NAMESPACE.USER).upsertItems(context, upsertItems);

      // TODO(burdon): Make automatic.
      this._database.fireMutationNotification(context);
    }
  }
}
