//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';

import { DomUtil, Logger } from 'alien-util';
import { Const } from 'alien-core';
import { WebApp } from 'alien-client/web-app/main';

Logger.setLevel({

  'app':        Logger.Level.debug,
  'net':        Logger.Level.debug,
  'auth':       Logger.Level.debug,
  'client':     Logger.Level.debug,
  'mutations':  Logger.Level.debug,
  'cloud':      Logger.Level.debug

}, Logger.Level.debug);

/**
 * Configuration (from server).
 */
const config = _.defaultsDeep(window.config, {

  debug: (window.config.env !== 'production'),

  // Framework debug options.
  options: {
    debugInfo: (window.config.env !== 'production') && false,
    optimisticResponse: false,
    invalidations: false,
    networkDelay: 0
  },

  app: {
    platform: DomUtil.isMobile() ? Const.PLATFORM.MOBILE : Const.PLATFORM.WEB
  }
});

const app = new WebApp(config);

//
// React Hot Loader.
// https://github.com/gaearon/react-hot-boilerplate/pull/61
// https://webpack.github.io/docs/hot-module-replacement.html
//

const render = () => {
  // Load the root component.
  const App = require('alien-client/web-app/test_root');
  app.render(App);
};

if (module.hot && _.get(config, 'env') === 'hot') {
  module.hot.accept('alien-client/web-app/test_root', () => render());
}

//
// Start app.
//

app.init().then(() => {
  render();
});
