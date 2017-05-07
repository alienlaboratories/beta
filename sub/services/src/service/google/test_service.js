//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';
import path from 'path';
import yaml from 'node-yaml';

import { Logger } from 'alien-util';
import { Database, IdGenerator, Matcher, SystemStore } from 'alien-core';

import { GoogleDriveClient } from './google_drive';
import { Firebase } from '../../db/firebase/firebase';
import { FirebaseItemStore } from '../../db/firebase/firebase_item_store';

const logger = Logger.get('test');

// TODO(burdon): Set-up as large test.

/**
 * Asynchronously load the configuration.
 */
async function config(baseDir) {
  return await {
    'firebase': await yaml.read(path.join(baseDir, 'firebase/alienlabs-dev.yml')),
    'google':   await yaml.read(path.join(baseDir, 'google/alienlabs-dev.yml')),
  };
}

config('../../../../../conf').then(config => {

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

  // TODO(burdon): Replace with alice.
  const text = 'entube';
  const email = 'rich.burdon@gmail.com';

  // Get token for user and make request.
  systemStore.queryItems({}, {}, { type: 'User' }).then(items => {
    let user = _.find(items, item => item.email === email);
    console.assert(user);
    let context = {
      credentials: _.get(user, 'credentials')
    };

    // Test query.
    let client = new GoogleDriveClient(new IdGenerator(), _.get(config, 'google'));
    client.search(context, `fullText contains "${text}"`, 10).then(results => {
      logger.log(`Results for ${email}:\n`, _.map(results, result => _.pick(result, 'title')));
      firebase.close();
    });
  });
});
