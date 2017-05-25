//
// Copyright 2017 Alien Labs.
//

import ReactDOM from 'react-dom';
import gql from 'graphql-tag';
import { graphql, print } from 'graphql';

import { DatabaseUtil, TestData } from 'alien-core/testing';
import { SchemaUtil } from 'alien-api/testing';

import { App } from './apollo';

/**
 * Initialize.
 */
async function init() {

  // Create schema.
  let data = new TestData();
  let database = await DatabaseUtil.init(DatabaseUtil.createDatabase(), data.context, data.itemMap);
  let schema = SchemaUtil.createSchema(database);

  // Test schema.
  let root = {};
  let context = { userId: data.userId };
  const query = gql`query TestQuery { viewer { user { id } } }`;
  await graphql(schema, print(query), root, context).then(result => {
    console.log(JSON.stringify(result));
  });

  // Config.
  return {
    testing: {
      schema
    },
    userProfile: {
      id: data.userId
    }
  };
}

// TODO(burdon): Factor out.
// import Framework from 'alien-api/src/gql/framework.graphql';
// import Schema from 'alien-api/src/gql/schema.graphql';
// let server = mockServer(
//   concatenateTypeDefs([Framework, Schema]),
//   Resolvers.getResolverMap(database)
// );
//
// server.query(print(gql`query TestQuery { viewer { user { id } } }`))
//   .then(result => console.log(JSON.stringify(result)));

/**
 * Complete minimal React-Redux-Apollo client app.
 */
init().then(config => {
  new App(config).init().then(app => {
    console.log('Initialized.');
    ReactDOM.render(app.root, document.getElementById('app-root'));
  });
});
