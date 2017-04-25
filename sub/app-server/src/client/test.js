//
// Copyright 2017 Alien Labs.
//

import React from 'react';
import ReactDOM from 'react-dom';

import { App } from 'alien-client/web/testing/apollo';

import { Const } from '../common/const';

/**
 * Complete minimal React-Redux-Apollo client app.
 */
ReactDOM.render(new App().root, document.getElementById(Const.DOM_ROOT));
