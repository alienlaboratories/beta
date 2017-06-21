//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';

import gql from 'graphql-tag';

import {
  graphql,
  print,
  GraphQLID,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString
} from 'graphql';

import { concatenateTypeDefs, mockServer } from 'graphql-tools';
import { introspectionQuery } from 'graphql/utilities';

import { Database } from 'alien-core';
import { DatabaseUtil } from 'alien-core/src/testing';

import { SchemaUtil } from './schema';

import Framework from './gql/framework.graphql';
import Schema from './gql/schema.graphql';

const TypeDefs = concatenateTypeDefs([ Framework, Schema ]);

//
// 3 Tests (Native GraphQL API + 2 Apollo graphql-tools).
//

const query = gql`
  query TestQuery { 
    viewer {
      user {
        id
        title
      }
    }
  }
`;

const testResult = (result, expected) => {
  return new Promise((resolve, reject) => {
    console.assert(result);
    if (result.errors) {
      console.error(result.errors);
      reject();
    } else {
      expect(result.data).toEqual(expected);
      resolve();
    }
  });
};

//
// Debugging
// - Install PyCharm chrome extension.
// - Create Debug configuration.
// - Reload Chrome tab to re-run tests (temperamental).
//

//
// Mock server.
// https://github.com/apollostack/graphql-tools
//

describe('GraphQL Mock Server:', () => {
  let context = { userId: 'alien' };

  // http://dev.apollodata.com/tools/graphql-tools/resolvers.html
  let resolverMap = {
    RootQuery: () => ({
      viewer: (root, args) => {
        let { userId:id } = context;

        return {
          user: {
            id,
            type: 'User',
            title: 'Alien'
          }
        };
      }
    })
  };

  // http://graphql.org/blog/mocking-with-graphql
  let server = mockServer(TypeDefs, resolverMap);

  test('Query viewer', () => {
    return server.query(print(query)).then(result => testResult(result, {
      viewer: {
        user: {
          id: 'alien',
          title: 'Alien'
        }
      }
    }));
  });
});

//
// Executable schema (using database).
// https://github.com/graphql/graphql-js
// https://github.com/apollostack/frontpage-server/blob/master/data/schema.js
//

describe('GraphQL Executable Schema:', () => {
  let context = {
    userId: 'alien',
    clientId: 'client-1'
  };

  let database = DatabaseUtil.createDatabase();

  let schema = SchemaUtil.createSchema(database);

  let item = { id: 'alien', type: 'User', displayName: 'Alien' };

  test('Query viewer', () => {
    return database.getItemStore(Database.NAMESPACE.SYSTEM)
      .upsertItems(context, [item])
      .then(() => {
        return database.getItemStore(Database.NAMESPACE.SYSTEM).getItem(context, 'User', 'alien').then(item => {
          expect(item.id).toEqual('alien');

          let root = {};

          // https://github.com/graphql/graphql-js/blob/master/src/graphql.js
          return graphql(schema, print(query), root, context).then(result => testResult(result, {
            viewer: {
              user: {
                id: 'alien',
                title: 'Alien'
              }
            }
          }));
        });
      });
  });
});

//
// Native GraphQL API.
// https://github.com/graphql/graphql-js
//

describe('GraphQL JS API:', () => {
  let context = { userId: 'alien' };

  let database = DatabaseUtil.createDatabase();

  let schema = new GraphQLSchema({
    query: new GraphQLObjectType({
      name: 'RootQuery',
      fields: {
        viewer: {
          type: new GraphQLObjectType({
            name: 'Viewer',
            fields: {
              user: {
                type: new GraphQLObjectType({
                  name: 'User',
                  fields: {
                    id: {
                      type: new GraphQLNonNull(GraphQLID)
                    },
                    title: {
                      type: new GraphQLNonNull(GraphQLString)
                    }
                  }
                })
              }
            },
          }),

          resolve(root, args, context, info) {
            let { userId } = context;
            return database.getItemStore(Database.NAMESPACE.SYSTEM).getItem(context, 'User', userId).then(user => {
              return {
                user
              };
            });
          }
        }
      }
    })
  });

  test('Generate JSON.', () => {
    return graphql(schema, introspectionQuery).then(result => {
//    console.log('SCHEMA:\n', JSON.stringify(result, 0, 2));
      expect(_.isObject(result)).toBe(true);
    });
  });

  test('Query viewer.', () => {
    return database.getItemStore(Database.NAMESPACE.SYSTEM)
      .upsertItems(context, [{ id: 'alien', type: 'User', title: 'Alien' }])
      .then(() => {
        let root = {};

        // https://github.com/graphql/graphql-js/blob/master/src/graphql.js
        return graphql(schema, print(query), root, context).then(result => testResult(result, {
          viewer: {
            user: {
              id: 'alien',
              title: 'Alien'
            }
          }
        }));
      });
  });
});
