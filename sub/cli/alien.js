#!/usr/bin/env babel-node

import _ from 'lodash';
import path from 'path';
import yaml from 'node-yaml';

import { App } from './src/app';

// TODO(burdon): Slow start-up. Compile.

global.__ENV__            = _.get(process.env, 'NODE_ENV', 'development');
global.__PRODUCTION__     = __ENV__ === 'production';
global.__DEVELOPMENT__    = __ENV__ === 'development';
global.__TESTING__        = __ENV__ === 'testing';

global.ENV = {
  ALIEN_CONFIG_AWS:       __PRODUCTION__ ? 'aws/aws-dev.yml'              : 'aws/aws-dev.yml',
  ALIEN_CONFIG_FIREBASE:  __PRODUCTION__ ? 'firebase/alienlabs-beta.yml'  : 'firebase/alienlabs-dev.yml',
  ALIEN_CONFIG_GOOGLE:    'google/alienlabs-dev.yml',

  ALIEN_SERVER_CONF_DIR: path.join(__dirname, '../../conf'),
  ALIEN_SERVER_DATA_DIR: path.join(__dirname, '../../data'),

  ALIEN_SERVER_URL: _.get(process.env, 'ALIEN_SERVER_URL', 'http://localhost:3000'),
};

async function config(baseDir) {
  return await {
    'aws':      await yaml.read(path.join(baseDir, global.ENV.ALIEN_CONFIG_AWS)),
    'firebase': await yaml.read(path.join(baseDir, global.ENV.ALIEN_CONFIG_FIREBASE)),
    'google':   await yaml.read(path.join(baseDir, global.ENV.ALIEN_CONFIG_GOOGLE)),
  };
}

config(global.ENV.ALIEN_SERVER_CONF_DIR).then(config => {
  new App(config).start().then(() => {
    // TODO(burdon): Close resources.
    process.exit(0);
  });
});
