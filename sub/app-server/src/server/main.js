//
// Copyright 2017 Alien Labs.
//

import path from 'path';
import yaml from 'node-yaml';

import { ErrorUtil, Logger } from 'alien-util';

import { WebServer } from './server';

import ENV from './env';

const logger = Logger.get('main');

/**
 * Asynchronously load the configuration.
 */
async function config(baseDir) {
  return await {
    'firebase':   await yaml.read(path.join(baseDir, ENV.ALIEN_CONFIG_FIREBASE)),
    'google':     await yaml.read(path.join(baseDir, ENV.ALIEN_CONFIG_GOOGLE)),
  };
}

//
// Error handling.
//

ErrorUtil.handleErrors(process, error => {
  logger.error(error);

  // TODO(burdon): Options to exit in dev mode.
//process.exit(1);
});

//
// Startup.
// The server can be tested in the following ways:
// - locally via nodemon.
// - locally via the webpack bundle.
// - deployed on the local minikube.
// - deployed to the test cluster.

config(ENV.APP_SERVER_CONF_DIR).then(config => {
  global.server = new WebServer(config);
  logger.info(WebServer.name, JSON.stringify(global.server.info, null, 2));
  global.server.init().then(server => server.start());
});
