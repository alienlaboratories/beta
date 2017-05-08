//
// Copyright 2017 Minder Labs.
//

import _ from 'lodash';
import path from 'path';
import yaml from 'node-yaml';

import { Logger } from 'alien-util';

import { Queue } from './util/bull_queue';

// TODO(burdon): Set-up as large test.
const CONF_DIR = path.join(__dirname, '../../../conf');

const logger = Logger.get('scheduler');

/**
 * Asynchronously load the configuration.
 */
async function config(baseDir) {
  return await {
    'alien': await yaml.read(path.join(baseDir, 'alien.yml')),
  };
}

config(CONF_DIR).then(config => {
  logger.info('Scheduler =', JSON.stringify(config, null, 2));

  let queueConfig = _.get(config, 'alien.tasks', {});
  let queue = new Queue(queueConfig.name, queueConfig.options);

  queue.process(data => {

    // TODO(burdon): Notify.
    // TODO(burdon): Sync.
    // TODO(burdon): Link.

    console.log('############', data);

  });
});
