//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';
import google from 'googleapis';
import Gmail from 'node-gmail-api';
import addrs from 'email-addresses';

import { ErrorUtil, Logger } from 'alien-util';

import { OAuthServiceProvider } from '../service';
import { GoogleApiUtil } from './google_api';

_.mixin({
  email: email => _.pick(addrs.parseOneAddress(email), 'name', 'address')
});

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
          .map(i => _.email(i.value))
          .value();

        let from = _.email(_.find(payload.headers, header => header.name === 'From').value);

        let subject = _.find(payload.headers, header => header.name === 'Subject').value;

        let item = {
          id: 'google.com/mail/' + id,
          type: 'Message',
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
