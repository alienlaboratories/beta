//
// Copyright 2017 Alien Labs.
//

import ReactDOM from 'react-dom';

import { App } from './apollo';

const config = {

  query: {
    network: 'testing'
  },

  userProfile: {
    id: 'user-1'
  }
};

/**
 * Complete minimal React-Redux-Apollo client app.
 */
new App(config).init().then(app => {
  console.log('Initialized.');
  ReactDOM.render(app.root, document.getElementById('app-root'));
});
