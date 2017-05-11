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
ReactDOM.render(new App(config).root, document.getElementById(AppDefs.DOM_ROOT));
