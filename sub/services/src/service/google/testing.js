//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';
import path from 'path';
import yaml from 'node-yaml';

import { Logger, TypeUtil } from 'alien-util';
import { Database, IdGenerator, Matcher, SystemStore } from 'alien-core';

import { Firebase } from '../../db/firebase/firebase';
import { FirebaseItemStore } from '../../db/firebase/firebase_item_store';

import { GoogleOAuthHandler } from './google_oauth';

import { GoogleCalendarClient } from './google_calendar';
import { GoogleDriveClient } from './google_drive';
import { GoogleMailClient } from './google_mail';

const logger = Logger.get('test');

//
// Testing:
// babel-node src/service/google/testing.js mail
//

// TODO(burdon): Set-up as large test.
// TODO(burdon): Generalize to test all services.
// TODO(burdon): Test syncers.
const CONF_DIR = path.join(__dirname, '../../../../../conf');

// TODO(burdon): Replace with alice test account.
// TODO(burdon): Encrypt data and keys.
const email = 'rich.burdon@gmail.com';

let service = 'mail';
if (process.argv.length > 2) {
  service = process.argv[2];
}

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

  // Get token for user and make request.
  systemStore.queryItems({}, {}, { type: 'User' }).then(items => {
    firebase.close();

    let user = _.find(items, item => item.email === email);
    console.assert(user);

    let authClient = GoogleOAuthHandler.createAuthClient(_.get(config, 'google'), _.get(user, 'credentials.google'));
    return GoogleOAuthHandler.refreshAccessToken(authClient).then(({ access_token }) => {
      _.set(user, 'credentials.google.access_token', access_token);

      return testApi(authClient, email, service)
        .catch(err => {
          console.error(err);
        });
    });
  });
});

function testApi(authClient, email, service) {
  const num = 20;

  // TODO(burdon): Opt verbose (yargs).
  let verbose = true;

  switch (service) {

    case 'calendar': {
      let client = new GoogleCalendarClient();

      let query = '';
      return client.events(authClient, query, num).then(result => {
        logger.log('Result:', TypeUtil.stringify(result));
      });
    }

    case 'drive': {
      let client = new GoogleDriveClient();

      const text = 'entube';
      const query = `fullText contains "${text}"`;
      return client.files(authClient, query, num).then(result => {
        logger.log('Result:', TypeUtil.stringify(result));
      });
    }

    case 'mail': {
      let client = new GoogleMailClient();

      let historyId = process.argv[3];
      if (historyId) {
        logger.log('History:', historyId);
        return client.history(authClient, historyId).then(result => {
          logger.log('Result:', TypeUtil.stringify(result));
          if (verbose) {
            let { items } = result;
            logger.log(TypeUtil.stringify(
              _.map(items, item => _.pick(item, 'id', 'title', 'from', 'snippet')), 2, true));
          }
        });
      } else {
        let query = 'label:UNREAD';
        logger.log('Query:', query);
        return client.messages(authClient, query, num).then(result => {
          logger.log('Result:', TypeUtil.stringify(result));
          if (verbose) {
            let { items } = result;
            logger.log(TypeUtil.stringify(
              _.map(items, item => _.pick(item, 'id', 'title', 'from', 'snippet')), 2, true));
          }
        });
      }
    }
  }

  return Promise.reject('Invalid type: ' + service);
}