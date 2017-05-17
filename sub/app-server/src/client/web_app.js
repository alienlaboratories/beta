//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';

import { DomUtil, Logger } from 'alien-util';
import { AppDefs } from 'alien-client';
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
    debug: (window.config.env !== 'production') && false,
    optimisticResponse: false,
    invalidations: false,
    networkDelay: 0
  },

  app: {
    platform: DomUtil.isMobile() ? AppDefs.PLATFORM.MOBILE : AppDefs.PLATFORM.WEB
  }
});

//
// App instance.
//

const app = new WebApp(config);

const render = () => {
  // Load the root component.
  const App = require('alien-client/web-app/root');
  app.render(App);
};

//
// React Hot Loader.
// https://github.com/gaearon/react-hot-boilerplate/pull/61
// https://webpack.github.io/docs/hot-module-replacement.html
//

if (module.hot && _.get(config, 'env') === 'hot') {
  module.hot.accept('alien-client/web-app/root', () => render());
}

//
// Prevent/warn unload.
// https://developer.mozilla.org/en-US/docs/Web/Events/beforeunload
//

window.addEventListener('beforeunload', event => {
  // NOTE: On Chrome the system message cannot be overridden.
  if (config.env === 'production') {
    event.returnValue = 'Exit?';
  }
});

window.addEventListener('unload', () => {
  // Unregister from BG page.
  app.terminate();
});

//
// Start app.
//

app.init().then(() => {
  render();
});
