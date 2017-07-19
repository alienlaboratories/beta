//
// Copyright 2017 Minder Labs.
//

import _ from 'lodash';
import AWS from 'aws-sdk';
import path from 'path';
import yaml from 'node-yaml';

import { Logger, TypeUtil } from 'alien-util';
import { Database, IdGenerator, Matcher, SystemStore } from 'alien-core';
import { Firebase, FirebaseItemStore, PushManager } from 'alien-services';

import { Queue } from './util/queue';

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

  // Notifications.
  let pushManager = new PushManager({
    serverKey: _.get(config, 'firebase.cloudMessaging.serverKey')
  });

  // Queue.
  let queue = new Queue(_.get(config, 'aws.sqs.tasks'));

  // Task registry.
  const tasks = {
    sync: {
      google: {
        calendar:   new GoogleCalendarSyncTask(config, database, pushManager),
        mail:       new GoogleMailSyncTask(config, database, pushManager),
      }
    }
  };

  // Process tasks.
  // TODO(burdon): Loop.
  queue.process((attributes, data) => {
    let { type } = attributes;

    let taskHandler = _.get(tasks, type);
    if (!taskHandler) {
      return Promise.reject(new Error('Invalid task:', TypeUtil.stringify(data)));
    }

    return taskHandler.execTask(data, attributes);
  });

  logger.info('Scheduler =', TypeUtil.stringify(config, 2));
});
