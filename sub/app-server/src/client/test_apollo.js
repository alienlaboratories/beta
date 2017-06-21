//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';
import ReactDOM from 'react-dom';

import { AppDefs } from 'alien-client';
import { App } from 'alien-client/web-test-apollo';
import { DatabaseUtil, TestData } from 'alien-core/src/testing';
import { SchemaUtil } from 'alien-api';

import TEST_DATA from 'alien-core/src/testing/data/data.json';

/**
 * Complete minimal React-Redux-Apollo client app with in memory resolvers.
 * https://github.com/apollographql/react-apollo/tree/master/examples/create-react-app#running-tests
 */
async function init() {
  let config = window.config;

  // Test local/remote.
  let network = _.get(config, 'query.network');
  if (network === 'testing') {
    // Create executable schema with test data.
    let data = new TestData(TEST_DATA);
    let database = await DatabaseUtil.init(DatabaseUtil.createDatabase(), data.context, data.itemMap);
    let schema = SchemaUtil.createSchema(database);

    _.assign(config, {
      testing: {
        schema,
        context: data.context
      },

      userProfile: {
        id: data.context.userId
      }
    });
  }

  return config;
}

init().then(config => {
  new App(config).init().then(app => {
    console.log('Initialized:', JSON.stringify(config));
    ReactDOM.render(app.root, document.getElementById(AppDefs.DOM_ROOT));
  });
});
