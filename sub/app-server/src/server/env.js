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

  HOST, PORT,

  APP_SERVER_ASSETS_DIR:  _.get(process.env, 'APP_SERVER_VIEWS_DIR',  path.join(__dirname, '../../dist')),
  APP_SERVER_PUBLIC_DIR:  _.get(process.env, 'APP_SERVER_PUBLIC_DIR', path.join(__dirname, './public')),
  APP_SERVER_VIEWS_DIR:   _.get(process.env, 'APP_SERVER_VIEWS_DIR',  path.join(__dirname, './views')),
};
