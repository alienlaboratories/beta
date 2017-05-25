//
// Copyright 2017 Alien Labs.
//

// TODO(burdon): Strip down alien-api to be client/server.

import gql from 'graphql-tag';
import { graphql, print } from 'graphql';

import { DatabaseUtil, TestData } from 'alien-core/testing';

// TODO(burdon): Can't include entire alien-api.
import { SchemaUtil } from 'alien-api/src/schema';

async function init() {

  let data = new TestData();
  let database = await DatabaseUtil.init(DatabaseUtil.createDatabase(), data.context, data.itemMap);

  let schema = SchemaUtil.createSchema(database);

  const query = gql`query TestQuery { viewer { user { id } } }`;

  let root = {};
  let context = { userId: data.userId };
  graphql(schema, print(query), root, context).then(result => {
    console.log(JSON.stringify(result));
  });
}

init();




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




// import ReactDOM from 'react-dom';

// import { App } from './apollo';

//
// import { Resolvers } from 'alien-api';
//
// import { DatabaseUtil, TestData } from 'alien-core/testing';
// // import { SchemaUtil } from 'alien-api';
//
// import { App } from './apollo';
//
// let data = new TestData();
// let database = DatabaseUtil.createDatabase(DatabaseUtil.init(), data.context, data.itemMap);
// // let schema = SchemaUtil.createSchema(database);
//
// // Resolvers.getResolverMap(database);
//
// const config = {
//   testing: {
//     // schema
//   },
//   userProfile: {
//     id: 'user-1'
//   }
// };
//
// /**
//  * Complete minimal React-Redux-Apollo client app.
//  */
// // new App(config).init().then(app => {
// //   console.log('Initialized.');
// //   ReactDOM.render(app.root, document.getElementById('app-root'));
// // });
