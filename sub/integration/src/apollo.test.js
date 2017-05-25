//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';
import gql from 'graphql-tag';
import ApolloClient from 'apollo-client';

import { ID } from 'alien-core';
import { DatabaseUtil, TestData } from 'alien-core/testing';
import { SchemaUtil } from 'alien-api/testing';
import { createFragmentMatcher } from 'alien-client';
import { LocalNetworkInterface } from 'alien-client/testing';

//
// End-to-end Apollo tests.
//

describe('End-to-end Apollo-GraphQL Resolver:', () => {

  const data = new TestData();

  let client;

  beforeAll(() => {
    // In-memory database.
    let database = DatabaseUtil.createDatabase();

    // Actual API resolvers.
    let schema = SchemaUtil.createSchema(database);

    // Apollo client with local network interface.
    client = new ApolloClient({
      networkInterface: new LocalNetworkInterface(schema, data.context),
      createFragmentMatcher: createFragmentMatcher(schema)
    });

    return DatabaseUtil.init(database, data.context, data.itemMap);
  });

  test('Viewer Query.', () => {
    client.resetStore();

    // Errors.
    // GraphQLError
    //   - Bad query.
    // Network error: Error: Schema must be an instance of GraphQLSchema.
    // Also ensure that there are not multiple versions of GraphQL installed in your node_modules directory.
    //   - Hoist graphql via lerna to the root package (lerna bootstrap --hoist graphql):
    //     - https://github.com/graphql/graphiql/issues/58

    const ViewerQuery = gql`
      query ViewerQuery { 
        viewer { 
          user { 
            id
            title 
          } 
        } 
      }
    `;

    return client.query({
      query: ViewerQuery
    }).then(result => {
      expect(_.get(result, 'data.viewer.user.id')).toEqual(data.context.userId);
    });
  });

  test('Items Query.', () => {

    // Query for items.
    const SearchQuery = gql`
      query SearchQuery($filter: FilterInput!) { 
        search(filter: $filter) { 
          items { 
            bucket
            type
            id 
            title 
          } 
        } 
      }
    `;

    // Query for item.
    const ItemQuery = gql`
      query ItemQuery($key: KeyInput!) { 
        item(key: $key) { 
          bucket
          type
          id 
          title 
        } 
      }
    `;

    // Muation for item.
    const ItemMutationQuery = gql`
      mutation ItemMutation($namespace: String, $itemMutations: [ItemMutationInput]!) {
        upsertItems(namespace: $namespace, itemMutations: $itemMutations) {
          bucket
          type
          id 
          title 
        }
      }
    `;

    // Query items.
    return client.query({
      query: SearchQuery,
      variables: {
        filter: {
          type: 'Task'
        }
      }
    }).then(result => {
      let items = _.get(result, 'data.search.items');
      expect(items).toBeTruthy();

      // Query item.
      return client.query({
        query: ItemQuery,
        variables: {
          key: ID.key(items[0])
        }
      }).then(result => {
        let item = _.get(result, 'data.item');
        expect(ID.key(item)).toEqual(ID.key(items[0]));

        // Mutate item.
        let title = 'New Title';
        return client.mutate({
          mutation: ItemMutationQuery,
          variables: {
            itemMutations: [
              {
                key: ID.key(item),
                mutations: [
                  {
                    field: 'title',
                    value: {
                      string: title
                    }
                  }
                ]
              }
            ]
          }
        }).then(result => {
          let item = _.get(result, 'data.upsertItems[0]');
          expect(item.title).toEqual(title);

          // Get cached item directly from store.
          let data = client.readQuery({
            query: ItemQuery,
            variables: {
              key: ID.key(items[0])
            }
          });

          expect(data.item.title).toEqual(item.title);
        });
      });
    });
  });
});
