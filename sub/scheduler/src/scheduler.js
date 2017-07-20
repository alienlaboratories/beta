//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';
import AWS from 'aws-sdk';
import path from 'path';
import yaml from 'node-yaml';

import { Logger, TypeUtil } from 'alien-util';
import { Database, IdGenerator, Matcher, SystemStore } from 'alien-core';
import { Firebase, FirebaseItemStore, PushManager } from 'alien-services';

import { Queue } from './util/queue';
import { Task } from './task';

import { GoogleCalendarSyncTask, GoogleMailSyncTask } from './tasks/sync/google';

// TODO(burdon): Set-up as large test.
const CONF_DIR = path.join(__dirname, '../../../conf');

const logger = Logger.get('scheduler');

/**
 * Asynchronously load the configuration.
 */
// TODO(burdon): Dockerfile (see app-server).
async function config(baseDir) {
  return await {
    'alien':    await yaml.read(path.join(baseDir, 'alienlabs-dev.yml')),
    'aws':      await yaml.read(path.join(baseDir, 'aws/aws-dev.yml')),
    'firebase': await yaml.read(path.join(baseDir, 'firebase/alienlabs-dev.yml')),
    'google':   await yaml.read(path.join(baseDir, 'google/alienlabs-dev.yml')),
  };
}

config(CONF_DIR).then(config => {
  logger.info('Scheduler =', TypeUtil.stringify(config, 2));

  let idGenerator = new IdGenerator();
  let matcher = new Matcher();

  // AWS config.
  // http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Config.html#constructor-property
  AWS.config.update({
    region:           _.get(config, 'aws.region'),
    accessKeyId:      _.get(config, 'aws.users.scheduler.aws_access_key_id'),
    secretAccessKey:  _.get(config, 'aws.users.scheduler.aws_secret_access_key')
  });

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
    .registerHandler('sync.google.calendar',  new GoogleCalendarSyncTask(config, database, pushManager))
    .registerHandler('sync.google.mail',      new GoogleMailSyncTask(config, database, pushManager))
    .start();
});

/**
 * Test task.
 */
class TestTask extends Task {

  async execTask(data) {
    console.log('Test: ' + JSON.stringify(data));
  }
}

/**
 * Task scheduler.
 */
class Scheduler {

  // TODO(burdon): Generalize Queue processor.

  constructor(config) {
    this._handlers = new Map();
    this._queue = new Queue(_.get(config, 'aws.sqs.tasks'));
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
      return taskHandler.execTask(data);
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
