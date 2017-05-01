//
// Copyright 2017 Alien Labs.
//

import React from 'react';
import ReactDOM from 'react-dom';

import { AppDefs } from 'alien-client';
import { Logger } from 'alien-util';

const logger = Logger.get('hot');

/**
 * Render root component.
 */
const render = () => {
  // NOTE: Module string cannot be moved to const.
  const TestApp = require('alien-client/web-app/testing/sanity');
  ReactDOM.render(<TestApp/>, document.getElementById(AppDefs.DOM_ROOT));
  logger.info('Render.');
};

/**
 * Listen for module updates.
 * https://github.com/gaearon/react-hot-boilerplate/pull/61
 * https://webpack.github.io/docs/hot-module-replacement.html
 */
if (module.hot) {
  module.hot.accept('alien-client/web-app/testing/sanity', () => render());
}

/**
 * Initial render.
 */
render();
