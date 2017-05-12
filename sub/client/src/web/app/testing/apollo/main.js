//
// Copyright 2017 Alien Labs.
//

import ReactDOM from 'react-dom';

import { App } from './apollo';

/**
 * Complete minimal React-Redux-Apollo client app.
 */
new App().init(app => {
  ReactDOM.render(app.root, document.getElementById('test-container'));
});
