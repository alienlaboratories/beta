//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';
import gql from 'graphql-tag';
import ApolloClient from 'apollo-client';

import { TypeUtil } from 'alien-util';
import { ID, MutationUtil, Transforms } from 'alien-core';
import { DatabaseUtil, TestData } from 'alien-core/testing';
import { SchemaUtil } from 'alien-api/testing';
import { createFragmentMatcher } from 'alien-client';
import { LocalNetworkInterface } from 'alien-client/testing';

//
// End-to-end Apollo tests.
//

// TODO(burdon): Subscriptions.
// TODO(burdon): Mutations and store writes.
// TODO(burdon): Test fragments.
// TODO(burdon): Version numbers (inc. on server).
// TODO(burdon): Document effect of just returning IDs for mutation (e.g., cache doesn't update field even if opt).
// TODO(burdon): Try this on main app and/or context setting to return IDs only (rather than object lookup).
// TODO(burdon): Is is necessary to return any information from the mutation (can opt result alone update store).

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

// TODO(burdon): Not used.
const ProjectQuery = gql`
  query ProjectQuery($key: KeyInput!) { 
    item(key: $key) { 
      bucket
      type
      id 
      title 
      
      ... on Project {
        tasks {
          bucket
          type
          id
          title
        }
      }
    } 
  }
`;

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

const TaskFragment = gql`
  fragment TaskFragment on Task {
    status
  }
`;

const TaskQuery = gql`
  query TaskQuery($key: KeyInput!) { 
    item(key: $key) { 
      bucket
      type
      id 
      title 
      
      ...TaskFragment
    } 
  }
  
  ${TaskFragment}
`;

const ItemMutation = gql`
  mutation ItemMutation($namespace: String, $itemMutations: [ItemMutationInput]!) {
    upsertItems(namespace: $namespace, itemMutations: $itemMutations) {
      bucket
      type
      id 
      title 
    }
  }
`;

describe('End-to-end Apollo-GraphQL Resolver:', () => {

  const testData = new TestData();

  const bucket = testData.context.buckets[0];

  let client;
  let networkInterface;

  beforeEach(() => {
    // In-memory database.
    let database = DatabaseUtil.createDatabase();

    // Actual API resolvers.
    let schema = SchemaUtil.createSchema(database);

    // Local network.
    networkInterface = new LocalNetworkInterface(schema, testData.context);

    // Apollo client.
    client = new ApolloClient({
      networkInterface,
      createFragmentMatcher: createFragmentMatcher(schema)
    });

    return DatabaseUtil.init(database, testData.context, testData.itemMap);
  });

  test('Viewer Query.', async () => {

    // Errors.
    // GraphQLError
    //   - Bad query.
    // Network error: Error: Schema must be an instance of GraphQLSchema.
    // Also ensure that there are not multiple versions of GraphQL installed in your node_modules directory.
    //   - Hoist graphql via lerna to the root package (lerna bootstrap --hoist graphql):
    //     - https://github.com/graphql/graphiql/issues/58

    let result = await client.query({
      query: ViewerQuery
    });

    expect(_.get(result, 'data.viewer.user.id')).toEqual(testData.context.userId);
  });

  test('Query and mutate item then read from cache.', async () => {

    // Query tasks.
    let searchResult = await client.query({
      query: SearchQuery,
      variables: {
        filter: {
          type: 'Task'
        }
      }
    });

    let items = _.get(searchResult, 'data.search.items');
    expect(items).toBeTruthy();

    // Query item.
    let itemResult = await client.query({
      query: ItemQuery,
      variables: {
        key: ID.key(items[0])
      }
    });

    let item = _.get(itemResult, 'data.item');
    expect(ID.key(item)).toEqual(ID.key(items[0]));

    // Mutate item.
    let title = 'New Title';
    let mutationResult = await client.mutate({
      mutation: ItemMutation,
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
    });

    let upsertItem = _.get(mutationResult, 'data.upsertItems[0]');
    expect(upsertItem.title).toEqual(title);

    // Get cached item directly from store.
    // http://dev.apollodata.com/core/apollo-client-api.html#ApolloClient.readQuery
    let { item:cachedItem } = client.readQuery({
      query: ItemQuery,
      variables: {
        key: ID.key(items[0])
      }
    });

    expect(cachedItem.title).toEqual(upsertItem.title);
  });

  test('Optmistic update.', async () => {
    let mutatedItem;

    // TODO(burdon): dataIdFromObject
    const taskId = 'Task:T-1';

    const taskKey = { bucket, type: 'Task', id: 'T-1' };

    {
      let { data: { item } } = await client.query({
        query: TaskQuery,
        variables: {
          key: taskKey
        }
      });

      // Change fields (clone item since it's immutable).
      mutatedItem = Transforms.applyObjectMutations(TypeUtil.clone(item), [
        MutationUtil.createFieldMutation('title', 'string', 'New Title'),
        MutationUtil.createFieldMutation('status', 'int', 1)
      ]);

      expect(networkInterface.count).toEqual(1);
    }

    {
      // Update item in cache.
      // http://dev.apollodata.com/core/apollo-client-api.html#ApolloClient.writeFragment
      console.log('Updating item: ' + JSON.stringify(mutatedItem));
      client.writeFragment({
        id: taskId,
        fragment: TaskFragment,
        fragmentName: 'TaskFragment',
        data: mutatedItem
      });

      let taskFragment = client.readFragment({
        id: taskId,
        fragment: TaskFragment,
        fragmentName: 'TaskFragment'
      });

      // Only updates the fields named in the fragment (i.e., status).
      console.log('Updated fragment: ' + JSON.stringify(taskFragment));

      // Update query.
      // http://dev.apollodata.com/core/apollo-client-api.html#ApolloClient.writeQuery
      client.writeQuery({
        query: TaskQuery,
        variables: {
          key: taskKey
        },
        data: {
          item: mutatedItem
        }
      });
    }

    {
      // Test reading query from cache.
      // http://dev.apollodata.com/core/apollo-client-api.html#ApolloClient.readQuery
      let { item } = client.readQuery({
        query: TaskQuery,
        variables: {
          key: taskKey
        }
      });

      expect(networkInterface.count).toEqual(1);
      expect(item.title).toEqual(mutatedItem.title);
    }
  });

  // TODO(burdon): Query Project then update Task.
  test('Optmistic update.', async () => {

  });
});
