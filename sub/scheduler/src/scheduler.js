//
// Copyright 2017 Minder Labs.
//

import _ from 'lodash';
import path from 'path';
import yaml from 'node-yaml';

import { Logger, TypeUtil } from 'alien-util';
import { Database, IdGenerator, Matcher, SystemStore } from 'alien-core';
import { Firebase, FirebaseItemStore, PushManager } from 'alien-services';

import { Queue } from './util/bull_queue';

import { GmailSyncTask } from './task/sync';

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
    'firebase': await yaml.read(path.join(baseDir, 'firebase/alienlabs-dev.yml')),
    'google':   await yaml.read(path.join(baseDir, 'google/alienlabs-dev.yml')),
  };
}

config(CONF_DIR).then(config => {
  logger.info('Scheduler =', TypeUtil.stringify(config, 2));

  // System store (to look-up credentials).
  let firebase = new Firebase(_.get(config, 'firebase'));
  let systemStore = new SystemStore(
    new FirebaseItemStore(new IdGenerator(), new Matcher(), firebase.db, Database.NAMESPACE.SYSTEM, false));

  // Notifications.
  let pushManager = new PushManager({
    serverKey: _.get(config, 'firebase.cloudMessaging.serverKey')
  });

  // Task registry.
  let tasks = {
    'sync': new GmailSyncTask(config, pushManager, systemStore)
  };

  // Queue.
  let queueConfig = _.get(config, 'alien.tasks', {});
  let queue = new Queue(queueConfig.name, queueConfig.options);
  queue.process(data => {
    let task = tasks[data.task];
    if (!task) {
      logger.warn('Invalid task:', TypeUtil.stringify(data));
    } else {
      task.run(data);
    }
  });
});
