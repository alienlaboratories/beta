//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';
import path from 'path';
import yaml from 'node-yaml';

import { Logger, TypeUtil } from 'alien-util';
import { Database, IdGenerator, Matcher, SystemStore } from 'alien-core';
import { AWSUtil, Firebase, FirebaseItemStore, PushManager, AWSQueue } from 'alien-services';

import { Task } from './task';

import { GoogleCalendarSyncTask, GoogleMailSyncTask } from './tasks/sync/google';

const logger = Logger.get('scheduler');

// TODO(burdon): Factor out (see app-server).
const ENV = {
  ALIEN_SERVER_CONF_DIR:    _.get(process.env, 'ALIEN_SERVER_CONF_DIR',     path.join(__dirname, '../../../conf')),

  ALIEN_CONFIG:             _.get(process.env, 'ALIEN_CONFIG',              'alienlabs-dev.yml'),
  ALIEN_CONFIG_AWS:         _.get(process.env, 'ALIEN_CONFIG_AWS',          'aws/aws-dev.yml'),
  ALIEN_CONFIG_FIREBASE:    _.get(process.env, 'ALIEN_CONFIG_FIREBASE',     'firebase/alienlabs-dev.yml'),
  ALIEN_CONFIG_GOOGLE:      _.get(process.env, 'ALIEN_CONFIG_GOOGLE',       'google/alienlabs-dev.yml'),
};

/**
 * Asynchronously load the configuration.
 */
async function config(baseDir) {
  return await {
    'alien':      await yaml.read(path.join(baseDir, ENV.ALIEN_CONFIG)),
    'aws':        await yaml.read(path.join(baseDir, ENV.ALIEN_CONFIG_AWS)),
    'firebase':   await yaml.read(path.join(baseDir, ENV.ALIEN_CONFIG_FIREBASE)),
    'google':     await yaml.read(path.join(baseDir, ENV.ALIEN_CONFIG_GOOGLE)),
  };
}

config(ENV.ALIEN_SERVER_CONF_DIR).then(config => {
  logger.info('Scheduler =', TypeUtil.stringify(config, 2));

  AWSUtil.config(config);

  let idGenerator = new IdGenerator();
  let matcher = new Matcher();

  // System store (to look-up credentials).
  let firebase = new Firebase(_.get(config, 'firebase'));

  let systemStore = new SystemStore(
    new FirebaseItemStore(idGenerator, matcher, firebase.db, Database.NAMESPACE.SYSTEM, false));

  let userDataStore =
    new FirebaseItemStore(idGenerator, matcher, firebase.db, Database.NAMESPACE.USER, true);

  let database = new Database()
    .registerItemStore(systemStore)
    .registerItemStore(userDataStore)
    .registerQueryProcessor(systemStore)
    .registerQueryProcessor(userDataStore);

  let pushManager = new PushManager({
    serverKey: _.get(config, 'firebase.cloudMessaging.serverKey')
  });

  new Scheduler(config)
    .registerHandler('test',                  new TestTask())
    .registerHandler('sync.google.calendar',  new GoogleCalendarSyncTask(config, database, systemStore, pushManager))
    .registerHandler('sync.google.mail',      new GoogleMailSyncTask(config, database, systemStore, pushManager))
    .start();
});

/**
 * Test task.
 */
class TestTask extends Task {

  async execTask(attributes, data) {
    console.log('Test:', JSON.stringify(attributes), JSON.stringify(data));
  }
}

/**
 * Task scheduler.
 */
class Scheduler {

  // TODO(burdon): Generalize Queue processor (no longer a scheduler).

  constructor(config) {
    this._handlers = new Map();
    this._queue = new AWSQueue(_.get(config, 'aws.sqs.tasks'));
    this._running = false;
  }

  registerHandler(type, handler) {
    this._handlers.set(type, handler);
    return this;
  }

  async processTask() {
    return this._queue.process((attributes, data) => {
      let { type } = attributes;

      let taskHandler = this._handlers.get(type);
      if (!taskHandler) {
        return Promise.reject(new Error('Invalid task:', type));
      }

      console.log('Processing:', type, JSON.stringify(data));
      return taskHandler.execTask(attributes, data);
    });
  }

  async start() {
    this._running = true;

    while (this._running) {
      await this.processTask();
    }
  }

  stop() {
    this._running = false;
  }
}
