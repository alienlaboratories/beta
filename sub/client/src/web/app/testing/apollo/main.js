//
// Copyright 2017 Alien Labs.
//

import ReactDOM from 'react-dom';

import { App } from './apollo';

/**
 * Complete minimal React-Redux-Apollo client app.
 */
ReactDOM.render(new App().root, document.getElementById('test-container'));
