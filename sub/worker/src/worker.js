//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';
import path from 'path';
import yaml from 'node-yaml';

import { Async, ErrorUtil, Logger, TypeUtil } from 'alien-util';
import { Database, IdGenerator, Matcher, SystemStore } from 'alien-core';
import { AWSUtil, Firebase, FirebaseItemStore, ClientManager, AWSQueue } from 'alien-services';

import { Task } from './task';

import { GoogleCalendarSyncTask, GoogleMailSyncTask } from './tasks/sync/google';

const logger = Logger.get('worker');

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
  logger.info('Worker =', TypeUtil.stringify(config, 2));

  AWSUtil.config(config);

  let idGenerator = new IdGenerator();
  let matcher = new Matcher();

  // System store (to look-up credentials).
  let firebase = new Firebase(_.get(config, 'firebase'));

  let systemStore = new SystemStore(
    new FirebaseItemStore(idGenerator, matcher, firebase.db, Database.NAMESPACE.SYSTEM, false));

  let clientManager = new ClientManager(config,
    new FirebaseItemStore(new IdGenerator('C-'), matcher, firebase.db, Database.NAMESPACE.CLIENT, false));

  let dataStore =
    new FirebaseItemStore(idGenerator, matcher, firebase.db, Database.NAMESPACE.USER, true);

  let database = new Database()
    .registerItemStore(systemStore)
    .registerItemStore(dataStore)
    .registerQueryProcessor(systemStore)
    .registerQueryProcessor(dataStore)

    .onMutation((context, itemMutations, items) => {
      // Notify clients of changes.
      logger.log('Invalidating...');
      clientManager.invalidateClients();
    });

  // TODO(burdon): Registry by attributes. E.g.,
  // .registerHandler({ type: 'sync', service: 'google.com/calendar' }, task)

  new Worker(config)
    .registerHandler('test', new TestTask())
    .registerHandler('sync', new SyncTask()
      .registerHandler('google.com/calendar', new GoogleCalendarSyncTask(config, database, systemStore))
      .registerHandler('google.mail/mail', new GoogleMailSyncTask(config, database, systemStore))
    )
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
 * Sync multiplexer.
 */
class SyncTask extends Task {

  constructor() {
    super();
    this._syncHandlersByService = new Map();
  }

  registerHandler(service, handler) {
    this._syncHandlersByService.set(service, handler);
    return this;
  }

  async execTask(attributes, data) {
    let { service } = attributes;
    let syncHandler = this._syncHandlersByService.get(service);
    if (!syncHandler) {
      return Promise.reject(new Error('Syncer for service not registered: ' + service));
    }

    return syncHandler.execTask(attributes, data);
  }
}

/**
 * Task Worker.
 */
class Worker {

  constructor(config) {
    this._handlers = new Map();
    this._queue = new AWSQueue(_.get(config, 'aws.sqs.tasks'));
    this._running = false;
  }

  // TODO(burdon): Get from ServiceRegistry.
  registerHandler(type, handler) {
    this._handlers.set(type, handler);
    return this;
  }

  async processTask() {
    return this._queue.process((attributes, data) => {
      let { type } = attributes;

      let taskHandler = this._handlers.get(type);
      if (!taskHandler) {
        return Promise.reject(new Error('Invalid task: ' + type));
      }

      // TODO(burdon): Get message attributes (e.g., job handle).
      logger.log('Processing:', type, JSON.stringify(attributes), TypeUtil.stringify(data));
      return taskHandler.execTask(attributes, data);
    });
  }

  async start() {
    this._running = true;

    while (this._running) {
      await this.processTask().catch(err => {
        logger.error(ErrorUtil.message(err));

        // TODO(burdon): Back-off?
        return Async.timeout(5000);
      });
    }
  }

  stop() {
    this._running = false;
  }
}
