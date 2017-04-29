//
// Copyright 2017 Alien Labs.
//

import React from 'react';
import ReactDOM from 'react-dom';

import { WebApp } from 'alien-client/web';

import { Const } from '../common/const';

/**
 * Web App.
 */
ReactDOM.render(new WebApp().root, document.getElementById(Const.DOM_ROOT));
