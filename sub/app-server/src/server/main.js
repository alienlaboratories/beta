//
// Copyright 2017 Alien Labs.
//

import path from 'path';
import yaml from 'node-yaml';

import { ErrorUtil, Logger } from 'alien-util';

import { WebServer } from './server';

import ENV from './env';

const logger = Logger.get('server');

/**
 * Asynchronously load the configuration.
 */
// TODO(burdon): Separate file with logging.
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
});

//
// Startup.
//

config(ENV.APP_SERVER_CONF_DIR).then(config => {
  global.server = new WebServer(config).init().then(server => server.start());
});
