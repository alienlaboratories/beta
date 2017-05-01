//
// Copyright 2017 Alien Labs.
//

import React from 'react';
import ReactDOM from 'react-dom';

import { AppDefs } from 'alien-client';
import { App } from 'alien-client/web-testing-apollo';

/**
 * Complete minimal React-Redux-Apollo client app.
 */
ReactDOM.render(new App().root, document.getElementById(AppDefs.DOM_ROOT));
