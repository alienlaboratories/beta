//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';
import { graphql } from 'graphql';

import { Database } from 'alien-core';
import { DatabaseUtil } from 'alien-core/src/testing';

import { SchemaUtil } from './schema';

let database = null;
let schema = null;

describe('GraphQL Resolvers:', () => {

  const userId = 'tester';

  beforeAll(() => {
    database = DatabaseUtil.createDatabase();

    schema = SchemaUtil.createSchema(database);

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
      userId,
      buckets: [
        'bucket-1'
      ]
    };

    let query = `
      mutation BatchMutation($itemMutations: [ItemMutationInput]!) {
        batchMutation(itemMutations: $itemMutations) {
          keys {
            id
          }
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

      query = `
        query ItemQuery($key: KeyInput!) {
          item(key: $key) {
            id
            title
          }
        }
      `;

      variables = {
        key: {
          bucket: 'bucket-1',
          type: 'Task',
          id: 'item-1'
        }
      };

      return graphql(schema, query, root, context, variables).then(result => {
        if (result.errors) {
          throw new Error(result.errors);
        }

        expect(_.get(result, 'data.item.id')).toEqual('item-1');
      });
    });
  });
});
