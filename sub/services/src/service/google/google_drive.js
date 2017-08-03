//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';
import google from 'googleapis';

import { ErrorUtil, Logger } from 'alien-util';
import { ItemStore, QueryProcessor } from 'alien-core';

import { OAuthServiceProvider } from '../service';
import { GoogleApiUtil } from './util';

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
  files(authClient, query, maxResults) {
    logger.log(`Query(${maxResults}): <${query}>`);

    const fetcher = (pageToken, pageSize, i) => {
      return GoogleApiUtil.promisify(callback => {

        // https://developers.google.com/drive/v3/reference/files/list
        let params = {
          auth: authClient,
          q: query,
          fields: 'nextPageToken, files(id, name, webViewLink, mimeType)',
          spaces: 'drive',
          pageSize,
          pageToken
        };

        this._drive.files.list(params, callback);
      }).then(response => {
        let { nextPageToken, files } = response;
        return { nextPageToken, objects: files };
      });
    };

    return GoogleApiUtil.request(fetcher, maxResults).then(result => {
      let { objects } = result;
      return _.map(objects, object => GoogleDriveClient.toItem(object));
    });
  }

  /**
   * Convert Drive result to a schema object Item.
   */
  static toItem(file) {
    let { id, name, webViewLink, mimeType } = file;

    // TODO(burdon): Factor out (also check other types; set class instead of icon).
    const iconTypes = {
      'default':                                    'ux-icon-link',
      'application/vnd.google-apps.spreadsheet':    'ux-icon-spreadsheet',
      'application/vnd.google-apps.document':       'ux-icon-document',
      'application/vnd.google-apps.presentation':   'ux-icon-presentation',
      'application/pdf':                            'ux-icon-pdf'
    };

    let item = {
      namespace: NAMESPACE,
      type: 'Document',
      id: id,
      title: name,

      meta: {
        iconClassName: iconTypes[mimeType] || iconTypes['default']
      },

      externalUrl: webViewLink
    };

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
    return this._client.files(authClient, query, maxResults).then(items => {
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
