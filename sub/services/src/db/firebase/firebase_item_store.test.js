//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';
import path from 'path';
import yaml from 'node-yaml';
import { expect } from 'chai';

import admin from 'firebase-admin';

import { IdGenerator, Matcher, ItemStoreTests } from 'alien-core';

import { FirebaseItemStore } from './firebase_item_store';

const CONF_DIR = path.join(__dirname, '../../../../../conf');

// TODO(burdon): Make configurable.
async function config(baseDir) {
  return await {
    'firebase':       await yaml.read(path.join(baseDir, 'firebase/alienlabs-testing.yml')),
    'firebase-admin': await yaml.read(path.join(baseDir, 'firebase/alienlabs-testing-admin.yml')),
  };
}

config(CONF_DIR).then(config => {
  console.log('Config = ' + JSON.stringify(config, null, 2));

  const app = admin.initializeApp({
    databaseURL: _.get(config, 'firebase.app.databaseURL'),
    credential: admin.credential.cert(_.get(config, 'firebase.serviceAccount'))
  });

  const db = app.database();

  const idGenerator = new IdGenerator(1000);
  const matcher = new Matcher();

  //
  // End-to-end testing.
  // https://firebase.googleblog.com/2015/04/end-to-end-testing-with-firebase-server_16.html
  //

  describe('FirebaseItemStore (buckets):', () => {
    this.timeout(5000);

    ItemStoreTests(() => {
      return new FirebaseItemStore(idGenerator, matcher, db, 'testing', true).clear();
    });
  });

  describe('FirebaseItemStore (no buckets):', () => {
    this.timeout(5000);

    ItemStoreTests(() => {
      return new FirebaseItemStore(idGenerator, matcher, db, 'testing', false).clear();
    }, false);
  });
});
