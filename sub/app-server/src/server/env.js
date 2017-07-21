//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';
import path from 'path';

global.__ENV__            = _.get(process.env, 'NODE_ENV', 'development');
global.__PRODUCTION__     = __ENV__ === 'production';
global.__DEVELOPMENT__    = __ENV__ === 'development';
global.__HOT__            = __ENV__ === 'hot';
global.__TESTING__        = __ENV__ === 'testing';        // TODO(burdon): Document.

const HOST = _.get(process.env, 'HOST', __PRODUCTION__ ? '0.0.0.0' : '127.0.0.1');
const PORT = _.get(process.env, 'PORT', 3000);

/**
 * Environment variables set in the Dockerfile.
 */
export default {

  ENV: __ENV__,

  HOST, PORT,

  ALIEN_CONFIG:             _.get(process.env, 'ALIEN_CONFIG',              'alienlabs-testing.yml'),
  ALIEN_CONFIG_AWS:         _.get(process.env, 'ALIEN_CONFIG_AWS',          'aws/aws-dev.yml'),
  ALIEN_CONFIG_FIREBASE:    _.get(process.env, 'ALIEN_CONFIG_FIREBASE',     'firebase/alienlabs-dev.yml'),
  ALIEN_CONFIG_GOOGLE:      _.get(process.env, 'ALIEN_CONFIG_GOOGLE',       'google/alienlabs-dev.yml'),

  // TODO(burdon): Generate real secrets and move to config file.
  ALIEN_SESSION_SECRET:     _.get(process.env, 'ALIEN_SESSION_SECRET',      'alien-session-secret'),
  ALIEN_JWT_SECRET:         _.get(process.env, 'ALIEN_JWT_SECRET',          'alien-jwt-secret'),
  ALIEN_JWT_AUDIENCE:       _.get(process.env, 'ALIEN_JWT_AUDIENCE',        'alienlabs.io'),

  ALIEN_SERVER_URL:         _.get(process.env, 'ALIEN_SERVER_URL',          'http://localhost:' + PORT),

  ALIEN_SERVER_ASSETS_DIR:  _.get(process.env, 'ALIEN_SERVER_ASSETS_DIR',   path.join(__dirname, '../../dist')),
  ALIEN_SERVER_CONF_DIR:    _.get(process.env, 'ALIEN_SERVER_CONF_DIR',     path.join(__dirname, '../../../../conf')),
  ALIEN_SERVER_DATA_DIR:    _.get(process.env, 'ALIEN_SERVER_DATA_DIR',     path.join(__dirname, '../../../../data')),
  ALIEN_SERVER_PUBLIC_DIR:  _.get(process.env, 'ALIEN_SERVER_PUBLIC_DIR',   path.join(__dirname, './public')),
  ALIEN_SERVER_VIEWS_DIR:   _.get(process.env, 'ALIEN_SERVER_VIEWS_DIR',    path.join(__dirname, './views')),

};
