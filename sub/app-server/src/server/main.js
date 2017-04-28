//
// Copyright 2017 Alien Labs.
//

import path from 'path';
import yaml from 'node-yaml';

import { ErrorUtil, Logger } from 'alien-util';

import { WebServer } from './server';

import ENV from './env';

const logger = Logger.get('server');

logger.info('Config');

/**
 * Asynchronously load the configuration.
 */
// TODO(burdon): ENV to determine conf files (-dev, -testing).
// TODO(burdon): Separate file with loggiong.
async function config(baseDir) {
  return await {
    'firebase':         await yaml.read(path.join(baseDir, 'firebase/alienlabs-dev.yml')),
    'firebase-admin':   await yaml.read(path.join(baseDir, 'firebase/alienlabs-dev-admin.yml')),
    'google':           await yaml.read(path.join(baseDir, 'google/alienlabs-dev.yml')),
  };
}

//
// Error handling.
//

ErrorUtil.handleErrors(process, error => {
  logger.error(error);

  // TODO(burdon): Options to exit.
  process.exit(1);
});

//
// Startup.
//

config(ENV.APP_SERVER_CONF_DIR).then(config => {
  logger.info('Starting...');

  global.server = new WebServer(config).init().then(server => server.start());
  logger.info(global.server);
});
