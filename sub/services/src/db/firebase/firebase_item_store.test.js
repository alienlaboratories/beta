//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';
import path from 'path';
import yaml from 'node-yaml';

import admin from 'firebase-admin';

import { IdGenerator, Matcher } from 'alien-core';
import { ItemStoreTests } from 'alien-core/testing';

import { FirebaseItemStore } from './firebase_item_store';

const CONF_DIR = path.join(__dirname, '../../../../../conf');

// TODO(burdon): Make configurable.
async function config(baseDir) {
  return await {
    'firebase': await yaml.read(path.join(baseDir, 'firebase/alienlabs-testing.yml')),
  };
}

const idGenerator = new IdGenerator(1000);

const matcher = new Matcher();

describe('Integration: FirebaseItemStore (buckets):', () => {

  let app = null;

  beforeAll(() => {
    return config(CONF_DIR).then(config => {
      app = admin.initializeApp({
        databaseURL: _.get(config, 'firebase.app.databaseURL'),
        credential: admin.credential.cert(_.get(config, 'firebase.serviceAccount'))
      });
    });
  });

  afterAll(() => {
    app.delete();
  });

  ItemStoreTests(() => {
    return new FirebaseItemStore(idGenerator, matcher, app.database(), 'testing', true).clear();
  });
});

describe('Integration: FirebaseItemStore (no buckets):', () => {

  let app = null;

  beforeAll(() => {
    return config(CONF_DIR).then(config => {
      app = admin.initializeApp({
        databaseURL: _.get(config, 'firebase.app.databaseURL'),
        credential: admin.credential.cert(_.get(config, 'firebase.serviceAccount'))
      });
    });
  });

  afterAll(() => {
    app.delete();
  });

  ItemStoreTests(() => {
    return new FirebaseItemStore(idGenerator, matcher, app.database(), 'testing', false).clear();
  }, false);
});
