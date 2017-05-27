//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';
import gql from 'graphql-tag';
import { print } from 'graphql/language/printer';
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

const MetaTaskFragment = gql`
  fragment MetaTaskFragment on Task {
    title
  }
`;

const TaskFragment = gql`
  fragment TaskFragment on Task {
    status
  }
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
        title
#        ...TaskFragment
      } 
    } 
  }

`;
    // ...MetaTaskFragment

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

const TaskQuery = gql`
  query TaskQuery($key: KeyInput!) { 
    item(key: $key) { 
      bucket
      type
      id 
      title 
      
#      ...TaskFragment
    } 
  }
  
`;
// #  ${TaskFragment}

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

    // Apollo client.
    // http://dev.apollodata.com/core/apollo-client-api.html#apollo-client
    client = new ApolloClient({

      addTypename: true,                                        // Automatically add __typename to query spec.

      dataIdFromObject: item => item.type + ':' + item.id,      // TODO(burdon): Factor out.

      // fragmentMatcher: createFragmentMatcher(schema),

      networkInterface
    });

    return DatabaseUtil.init(database, testData.context, testData.itemMap);
  });

  if (false)
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
    console.log('## <=== RES\n', print(SearchQuery), JSON.stringify(searchResult, null, 2));
    return;


    let items = _.get(searchResult, 'data.search.items');
    expect(items).toBeTruthy();

//    console.log('###\n', JSON.stringify(items, null, 2));

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

  if (false)
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
  if (false)
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
    let mutatedTask = Transforms.applyObjectMutations(TypeUtil.clone(task), [
      MutationUtil.createFieldMutation('title', 'string', 'New Title'),
      MutationUtil.createFieldMutation('status', 'int', 1)
    ]);

    console.log('####', JSON.stringify(mutatedTask));

    client.writeFragment({
      id: task.type + ':' + task.id,          // TODO(burdon): Util.
      fragment: TaskFragment,
      fragmentName: 'TaskFragment',
      data: mutatedTask
    });

    let cachedTask = client.readFragment({
      id: task.type + ':' + task.id,          // TODO(burdon): Util.
      fragment: TaskFragment,
      fragmentName: 'TaskFragment'
    });

    console.log('######', JSON.stringify(cachedTask, null, 2));

    let { item:cachedProject } = client.readQuery({
      query: ProjectQuery,
      variables: {
        key: projectKey
      }
    });

    console.log('######', JSON.stringify(cachedProject, null, 2));
  });
});
