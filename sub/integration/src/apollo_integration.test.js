//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';
import gql from 'graphql-tag';
import ApolloClient from 'apollo-client';

import { Logger, TypeUtil } from 'alien-util';
import { ID, MutationUtil, Transforms } from 'alien-core';
import { DatabaseUtil, TestData } from 'alien-core/testing';
import { SchemaUtil } from 'alien-api/testing';
import { createFragmentMatcher } from 'alien-client';
import { LocalNetworkInterface } from 'alien-client/testing';
import TEST_DATA from 'alien-core/src/testing/data/data.json';

Logger.setLevel({}, Logger.Level.warn);

//
// End-to-end Apollo tests.
//

// TODO(burdon): Subscriptions.
// TODO(burdon): Mutations and store writes.
// TODO(burdon): Version numbers (inc. on server).
// TODO(burdon): Implment local network interface for main app.

//
// http://graphql.org/learn/queries/#fragments
// http://graphql.org/learn/queries/#inline-fragments
//

// TODO(burdon): Test fragments.
// - define "thin" fragments for all types: incl. Item meta directly (id, type, title) and non-vectors.
// - apply mutations in reducers for each query (traverse previousResult and apply)
//   - need objects for IDs.

// TODO(burdon): Fragments on interfaces?
// https://github.com/apollographql/apollo-client/issues/1741 [burdon]
// https://github.com/apollographql/apollo-client/issues/1708 [burdon]
// https://github.com/apollographql/react-apollo/issues/386

const ItemFragment = gql`
  fragment ItemFragment on Item {
    bucket
    type
    id 
    title
  }
`;

const TaskFragment = gql`
  fragment TaskFragment on Task {
    ...ItemFragment

    status
  }

  ${ItemFragment}
`;

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
        ...TaskFragment
      } 
    } 
  }
  
  ${TaskFragment}
`;

const ProjectQuery = gql`
  query ProjectQuery($key: KeyInput!) { 
    item(key: $key) { 
      ...ItemFragment
      
      ... on Project {
        tasks {
        ...TaskFragment
        }
      }
    } 
  }

  ${ItemFragment}
  ${TaskFragment}
`;

const ItemQuery = gql`
  query ItemQuery($key: KeyInput!) { 
    item(key: $key) { 
      ...ItemFragment
    } 
  }

  ${ItemFragment}
`;

const TaskQuery = gql`
  query TaskQuery($key: KeyInput!) { 
    item(key: $key) { 
      ...TaskFragment
    } 
  }
  
  ${TaskFragment}
`;

// TODO(burdon): Remove return items.
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

  const testData = new TestData(TEST_DATA);

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

    // TODO(burdon): Factor out factory.
    // Apollo client.
    // http://dev.apollodata.com/core/apollo-client-api.html#apollo-client
    client = new ApolloClient({

      // Automatically add __typename to query spec.
      addTypename: true,

      dataIdFromObject: ID.dataIdFromObject,

//    fragmentMatcher: createFragmentMatcher(['Project', 'Task']),
      fragmentMatcher: createFragmentMatcher(schema),

      networkInterface
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
    // http://dev.apollodata.com/core/apollo-client-api.html#ApolloClient\.query
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
    // http://dev.apollodata.com/core/apollo-client-api.html#ApolloClient\.query
    let itemResult = await client.query({
      query: ItemQuery,
      variables: {
        key: ID.key(items[0])
      }
    });

    let item = _.get(itemResult, 'data.item');
    expect(ID.key(item)).toEqual(ID.key(items[0]));

    // Mutate item.
    const title = 'Updated Task';
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

  test('Optimistic update.', async () => {
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
      console.log('Writing fragment: ' + JSON.stringify(mutatedItem));
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

      // TODO(burdon): Check equal?
      // Only updates the fields named in the fragment (i.e., status).
      console.log('Read fragment: ' + JSON.stringify(taskFragment));

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
  test('Mutations.', async () => {

    const projectKey = { bucket, type: 'Project', id: 'P-1' };

    // Query project.
    let projectResult = await client.query({
      query: ProjectQuery,
      variables: {
        key: projectKey
      }
    });

    let { data: { item:project }} = projectResult;
    let task = project.tasks[0];

    // Change fields (clone item since it's immutable).
    const title = 'Updated Task';
    let mutatedTask = Transforms.applyObjectMutations(TypeUtil.clone(task), [
      MutationUtil.createFieldMutation('title', 'string', title),
      MutationUtil.createFieldMutation('status', 'int', 1)
    ]);

    // Write mutated Task to cache.
    client.writeFragment({
      id: ID.dataIdFromObject(task),
      fragment: TaskFragment,
      fragmentName: 'TaskFragment',
      data: mutatedTask
    });

    // Read Task from cache.
    let cachedTask = client.readFragment({
      id: ID.dataIdFromObject(task),
      fragment: TaskFragment,
      fragmentName: 'TaskFragment'
    });
    expect(cachedTask.title).toEqual(title);

    // Read Project query from cache (check nested Task was updated).
    let { item:cachedProject } = client.readQuery({
      query: ProjectQuery,
      variables: {
        key: projectKey
      }
    });
    let cachedNestedTask = _.find(_.get(cachedProject, 'tasks'), t => t.id === task.id);
    expect(cachedNestedTask.title).toEqual(title);

    // TODO(burdon): Test different if different fragments.
    expect(cachedNestedTask).toEqual(cachedTask);
  });
});
