//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';
import ReactDOM from 'react-dom';

import { AppDefs } from 'alien-client';
import { App } from 'alien-client/web-test-apollo';

let config = window.config;

let promises = [];

let network = _.get(config, 'query.network');
if (network === 'testing') {

  new LocalNetworkInterface(schema, data.context);


  let networkInterface = new LocalNetworkInterface();  // TODO(burdon): Reducer state.
  promises.push(networkInterface.then(() => {
    _.set(config, 'testing.networkInterface', networkInterface);
  }));
}

/**
 * Complete minimal React-Redux-Apollo client app.
 */
Promise.all(promises).then(() => {
  new App(config).init().then(app => {
    ReactDOM.render(app.root, document.getElementById(AppDefs.DOM_ROOT));
  });
});
