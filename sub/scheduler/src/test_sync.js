//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';
import path from 'path';
import yaml from 'node-yaml';

import { Logger } from 'alien-util';
import { Database, IdGenerator, Matcher, SystemStore } from 'alien-core';
import { GoogleDriveClient } from 'alien-services';
import { Firebase, FirebaseItemStore } from 'alien-api';

const logger = Logger.get('test');

// TODO(burdon): Move to alien-services.

/**
 * Asynchronously load the configuration.
 */
async function config(baseDir) {
  return await {
    'firebase': await yaml.read(path.join(baseDir, 'firebase/alienlabs-dev.yml')),
    'google':   await yaml.read(path.join(baseDir, 'google/alienlabs-dev.yml')),
  };
}

config('../../../conf').then(config => {

  // TODO(burdon): Circular dep? Move SystemStore to services.
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

  // TODO(burdon): Get token.
  let context = {
    credentials: {
      google: {
        access_token: 'ya29.GltDBFqZLZaHT6mHbPDUlJFh4qsDP_wK3XvMglNqiaeDNU3kWUm9Bwqi8tigJVS-WcHYmZhqgPZPdTwbfj4WixF1m5VaGb4tNk33roArTzded-0o1EqP49wS4JHa',
        refresh_token: '1/1O2vVGQXM9NpK55ijBAPyasH0pXxQIVoCFnp9tyj9cM'
      }
    }
  };

  let client = new GoogleDriveClient(new IdGenerator(), _.get(config, 'google'));

  // Test query.
  const text = 'entube';
  client.search(context, `fullText contains "${text}"`, 10).then(results => {
    logger.log('Results:\n', _.map(results, result => _.pick(result, 'title')));
  });
});
