//
// Copyright 2017 Alien Labs.
//

import ReactDOM from 'react-dom';

import { AppDefs } from 'alien-client';
import { App } from 'alien-client/web-test-apollo';

let config = window.config;

/**
 * Complete minimal React-Redux-Apollo client app.
 */
new App(config).init().then(app => {
  ReactDOM.render(app.root, document.getElementById(AppDefs.DOM_ROOT));
});
