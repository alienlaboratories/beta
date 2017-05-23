//
// Copyright 2017 Alien Labs.
//

// import ReactDOM from 'react-dom';

// TODO(burdon): Strip down alien-api to be client/server.

import gql from 'graphql-tag';
import { graphql, print } from 'graphql';
import { concatenateTypeDefs, makeExecutableSchema, mockServer } from 'graphql-tools';

let server = mockServer(
  concatenateTypeDefs(['type RootQuery { root: String! } schema { query: RootQuery }']),
  {
    RootQuery: () => ({
      root: () => {
        return 'alien';
      }
    })
  }
);

server.query(print(gql`query TestQuery { root }`)).then(result => console.log(JSON.stringify(result)));

// let schema = makeExecutableSchema({
//   typeDefs: concatenateTypeDefs(['type RootQuery { root: String! } schema { query: RootQuery }']),
//   resolvers: {
//     RootQuery: {
//       root: () => {
//         console.log('!!!!!!!!!!!!!!');
//         return 'alien';
//       }
//     }
//   },
//   logger: {
//     log: (error) => {
//       console.error(error);
//     }
//   }
// });
//
// // TODO(burdon): This should fail.
// graphql(schema, print(gql`query TestQuery { root }`)).then(result => {
//   console.log(JSON.stringify(result));
// });

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
