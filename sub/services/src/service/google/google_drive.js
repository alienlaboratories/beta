//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';
import google from 'googleapis';

import { ErrorUtil, Logger } from 'alien-util';
import { ItemStore, QueryProcessor } from 'alien-core';

import { OAuthServiceProvider } from '../service';
import { GoogleApiUtil } from './google_api';

const NAMESPACE = 'google.com/drive';

const logger = Logger.get('google.drive');

/**
 * Google Drive API wrapper.
 *
 * https://developers.google.com/drive/v3/reference
 */
export class GoogleDriveClient {

  constructor() {
    // https://developers.google.com/drive/v3/web/quickstart/nodejs
    this._drive = google.drive('v3');
  }

  /**
   * Get list of documents matching the query.
   *
   * @param {google.auth.OAuth2} authClient
   * @param query
   * @param maxResults
   * @returns {Promise.<{Item}>}
   */
  list(authClient, query, maxResults) {
    logger.log(`Query(${maxResults}): <${query}>`);
    return GoogleApiUtil.request(this._list.bind(this, authClient, query), maxResults).then(items => {
      logger.log('Results: ' + items.length);
      return _.map(items, item => GoogleDriveClient.toItem(item));
    });
  }

  /**
   * Fetches a single page of results.
   */
  _list(authClient, query, pageSize, pageToken, num) {
    logger.log(`Page(${num}): ${pageSize}`);

    return new Promise((resolve, reject) => {

      // https://developers.google.com/drive/v3/reference/files/list
      let params = {
        auth: authClient,
        q: query,
        fields: 'nextPageToken, files(id, name, webViewLink, iconLink)',
        spaces: 'drive',
        pageSize,
        pageToken
      };

      this._drive.files.list(params, (err, response) => {
        if (err) {
          reject(err.message);
        } else {
          resolve({
            items: response.files,
            nextPageToken: response.nextPageToken
          });
        }
      });
    });
  }

  /**
   * Convert Drive result to a schema object Item.
   */
  static toItem(file) {
    let item = {
      namespace: NAMESPACE,
      type: 'Document',
      id: file.id,
      title: file.name
    };

    if (file.webViewLink) {
      item.url = file.webViewLink;
    }
    if (file.iconLink) {
      item.iconUrl = file.iconLink;
    }

    return item;
  }
}

/**
 * Query processor.
 */
export class GoogleDriveQueryProcessor extends QueryProcessor {

  /**
   * https://developers.google.com/drive/v3/web/search-parameters
   */
  static createQuery(queryString) {
    return _.isEmpty(queryString) ? null : `fullText contains \'${queryString}\'`;
  }

  /**
   * @param {GoogleOAuthProvider} authProvider
   */
  constructor(authProvider) {
    super(NAMESPACE);
    console.assert(authProvider);

    this._authProvider = authProvider;
    this._client = new GoogleDriveClient();
  }

  queryItems(context, root={}, filter={}) {
    let query = GoogleDriveQueryProcessor.createQuery(filter.text);
    if (!query) {
      return Promise.resolve([]);
    }

    let maxResults = filter.count || ItemStore.DEFAULT_COUNT;

    // TODO(burdon): Cache client?
    let authClient = this._authProvider.createAuthClient(_.get(context, 'credentials.google'));
    return this._client.list(authClient, query, maxResults).then(items => {
      return items;
    }).catch(err => {
      throw ErrorUtil.error('Google Drive', err);
    });
  }
}

/**
 * Google Drive service provider.
 */
export class GoogleDriveServiceProvider extends OAuthServiceProvider {

  static SCOPES = [
    'https://www.googleapis.com/auth/drive.readonly'
  ];

  constructor(authProvider) {
    super(authProvider, NAMESPACE, GoogleDriveServiceProvider.SCOPES);
  }

  get meta() {
    return {
      title: 'Google Drive',
      class: 'service-google-drive'
    };
  }
}
