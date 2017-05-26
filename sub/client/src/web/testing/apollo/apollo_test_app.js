//
// Copyright 2017 Alien Labs.
//

import ReactDOM from 'react-dom';
import { graphql, print } from 'graphql';
import gql from 'graphql-tag';

import { DatabaseUtil, TestData } from 'alien-core/testing';
import { SchemaUtil } from 'alien-api/testing';

import { App } from './apollo';

/**
 * Complete minimal React-Redux-Apollo client app with in memory resolvers.
 * https://github.com/apollographql/react-apollo/tree/master/examples/create-react-app#running-tests
 */

async function init() {

  // Create executable schema with test data.
  let data = new TestData();
  let database = await DatabaseUtil.init(DatabaseUtil.createDatabase(), data.context, data.itemMap);
  let schema = SchemaUtil.createSchema(database);

  // Test schema.
  let root = {};
  let context = data.context;
  const query = gql`query TestQuery { viewer { user { id } } }`;
  await graphql(schema, print(query), root, context).then(result => {
    console.assert(_.get(result, 'data.viewer.user.id') === data.context.userId);
  });

  // Config.
  return {
    testing: {
      schema,
      context: data.context
    },

    userProfile: {
      id: data.context.userId
    }
  };
}

init().then(config => {
  new App(config).init().then(app => {
    console.log('Initialized.');
    ReactDOM.render(app.root, document.getElementById('app-root'));
  });
});
