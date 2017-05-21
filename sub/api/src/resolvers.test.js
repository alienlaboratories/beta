//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';
import { graphql } from 'graphql';
import { makeExecutableSchema } from 'graphql-tools';

import { Database } from 'alien-core';
import { TestUtil } from 'alien-core/testing';

import { Resolvers } from './resolvers';

let schema = null;

describe('GraphQL Resolvers:', () => {

  const userId = 'test';

  beforeAll(() => {
    let database = TestUtil.createDatabase();

    schema = makeExecutableSchema({
      typeDefs: Resolvers.typeDefs,
      resolvers: Resolvers.getResolverMap(database),
      logger: {
        log: error => console.log('Schema Error', error)
      }
    });

    return database.getItemStore(Database.NAMESPACE.SYSTEM).upsertItems({}, [
      {
        id: userId,
        type: 'User',
        displayName: 'Test User'
      }
    ]);
  });

  test('Viewer query.', () => {
    let root = {};

    let context = {
      userId
    };

    let query = `
      query TestQuery { 
        viewer {
          user {
            id
            title
          }
        }
      }
    `;

    return graphql(schema, query, root, context).then(result => {
      if (result.errors) {
        throw new Error(result.errors);
      }

      expect(_.get(result, 'data.viewer.user.id')).toEqual(userId);
    });
  });

  test('Upsert and query.', () => {
    let root = {};

    let context = {
      userId
    };

    let query = `
      mutation UpsertItemsMutation($itemMutations: [ItemMutationInput]!) {
        upsertItems(itemMutations: $itemMutations) {
          id
        }  
      }
    `;

    let variables = {
      itemMutations: [
        {
          key: {
            bucket: 'bucket-1',
            type: 'Task',
            id: 'item-1'
          },
          mutations: [
            {
              field: 'bucket',        // TODO(burdon): From key.
              value: {
                string: 'bucket-1'
              }
            },
            {
              field: 'title',
              value: {
                string: 'Task 1'
              }
            }
          ]
        }
      ]
    };

    return graphql(schema, query, root, context, variables).then(result => {
      if (result.errors) {
        throw new Error(result.errors);
      }
    });
  });
});
