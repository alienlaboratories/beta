//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';
import path from 'path';

global.__ENV__            = _.get(process.env, 'NODE_ENV', 'development');
global.__DEVELOPMENT__    = __ENV__ === 'development';
global.__PRODUCTION__     = __ENV__ === 'production';
global.__HOT__            = __ENV__.startsWith('hot');
global.__TESTING__        = !__PRODUCTION__;

const HOST = _.get(process.env, 'HOST', __PRODUCTION__ ? '0.0.0.0' : '127.0.0.1');
const PORT = _.get(process.env, 'PORT', 3000);

/**
 * Environment variables set in the Dockerfile.
 */
export default {

  ENV: __ENV__,

  HOST, PORT,

  ALIEN_JWT_SECRET:       _.get(process.env, 'ALIEN_JWT_SECRET',        'alien-jwt-secret'),
  ALIEN_JWT_AUDIENCE:     _.get(process.env, 'ALIEN_JWT_AUDIENCE',      'alienlabs.com'),
  ALIEN_SESSION_SECRET:   _.get(process.env, 'ALIEN_SESSION_SECRET',    'alien-session-secret'),

  APP_SERVER_URL:         _.get(process.env, 'APP_SERVER_URL',          'http://localhost:' + PORT),

  APP_SERVER_CONF_DIR:    _.get(process.env, 'APP_SERVER_CONF_DIR',     path.join(__dirname, '../../../../conf')),
  APP_SERVER_DATA_DIR:    _.get(process.env, 'APP_SERVER_DATA_DIR',     path.join(__dirname, '../../../../data')),
  APP_SERVER_ASSETS_DIR:  _.get(process.env, 'APP_SERVER_VIEWS_DIR',    path.join(__dirname, '../../dist')),
  APP_SERVER_PUBLIC_DIR:  _.get(process.env, 'APP_SERVER_PUBLIC_DIR',   path.join(__dirname, './public')),
  APP_SERVER_VIEWS_DIR:   _.get(process.env, 'APP_SERVER_VIEWS_DIR',    path.join(__dirname, './views')),
};
