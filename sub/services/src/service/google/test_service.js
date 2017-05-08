//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';
import path from 'path';
import yaml from 'node-yaml';

import { Logger } from 'alien-util';
import { Database, IdGenerator, Matcher, SystemStore } from 'alien-core';

import { Firebase } from '../../db/firebase/firebase';
import { FirebaseItemStore } from '../../db/firebase/firebase_item_store';

import { GoogleOAuthProvider } from './google_oauth';

import { GoogleDriveClient } from './google_drive';
import { GoogleMailClient } from './google_mail';

const logger = Logger.get('test');

// TODO(burdon): Set-up as large test.
const CONF_DIR = path.join(__dirname, '../../../../../conf');

/**
 * Asynchronously load the configuration.
 */
async function config(baseDir) {
  return await {
    'firebase': await yaml.read(path.join(baseDir, 'firebase/alienlabs-dev.yml')),
    'google':   await yaml.read(path.join(baseDir, 'google/alienlabs-dev.yml')),
  };
}

config(CONF_DIR).then(config => {

  // System store (to look-up credentials).
  let firebase = new Firebase(_.get(config, 'firebase'));
  let systemStore = new SystemStore(
    new FirebaseItemStore(new IdGenerator(), new Matcher(), firebase.db, Database.NAMESPACE.SYSTEM, false));

  //
  // Google APIs Errors:
  //
  // UnhandledPromiseRejectionWarning: Unhandled promise rejection (rejection id: 2): No access or refresh token is set.
  //
  // UnhandledPromiseRejectionWarning: Unhandled promise rejection (rejection id: 1): Invalid Credentials
  // - access_token expired (and no refresh_token set).
  //
  // UnhandledPromiseRejectionWarning: Unhandled promise rejection (rejection id: 1): Access Not Configured.
  // - Enable API for project (and wait 5 minutes)
  // - https://console.cloud.google.com/apis/library?project=alienlabs-dev [933786919888]
  //

  // TODO(burdon): Replace with alice. Encrypt.
  const email = 'rich.burdon@gmail.com';

  // Get token for user and make request.
  systemStore.queryItems({}, {}, { type: 'User' }).then(items => {
    firebase.close();

    let user = _.find(items, item => item.email === email);
    console.assert(user);
    let context = {
      credentials: _.get(user, 'credentials')
    };

    let authClient = GoogleOAuthProvider.createAuthClient(
      _.get(config, 'google'), _.get(context, 'credentials.google'));

    authClient.refreshAccessToken((err, tokens) => {
      console.assert(!err);
      let { access_token } = tokens;

      // https://github.com/google/google-api-nodejs-client/#manually-refreshing-access-token
      // TODO(burdon): Save updated access_token in service calls.
      _.set(context, 'credentials.google.access_token', access_token);

      if (false) {
        const text = 'entube';
        const query = `fullText contains "${text}"`;

        let client = new GoogleDriveClient();
        client.list(authClient, query, 10).then(results => {
          logger.log(`Results for ${email}:\n`, _.map(results, result => _.pick(result, 'title')));
        });
      }

      if (true) {
        let query = 'label:UNREAD';

        let client = new GoogleMailClient();
        client.list(authClient, query, 10).then(results => {
          logger.log(`Results for ${query}:\n`,
            JSON.stringify(_.map(results, result => _.pick(result, 'from', 'title')), null, 2));
        });
      }
    });
  });
});
