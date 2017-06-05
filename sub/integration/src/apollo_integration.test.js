//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';
import gql from 'graphql-tag';
import ApolloClient from 'apollo-client';

import { Logger, TypeUtil } from 'alien-util';
import { Batch, BatchMutation, FragmentsMap, ID, IdGenerator, MutationUtil, Transforms } from 'alien-core';
import { DatabaseUtil, TestData } from 'alien-core/testing';
import { SchemaUtil } from 'alien-api';
import { createFragmentMatcher } from 'alien-client';
import { LocalNetworkInterface } from 'alien-client/testing';
import TEST_DATA from 'alien-core/src/testing/data/data.json';

Logger.setLevel({ test: Logger.Level.log }, Logger.Level.warn);

const logger = Logger.get('test');

//
// End-to-end Apollo tests.
// NOTE: Does not depent on react (react-apollo).
//

// TODO(burdon): Handle error if create doesn't set all required fields.
// TODO(burdon): Test react graphql update in client tests (not here).
// TODO(burdon): Move fragments to alien-api.
// TODO(burdon): Implment local network interface for main app.
// TODO(burdon): Version numbers (inc. on server).

// TODO(burdon): Subscriptions (onMutation)? Make future proof. For now, invalidate and requery).
// http://dev.apollodata.com/react/subscriptions.html

// TODO(burdon): Update issues: (fragmentMatcher strings; version skew).
// https://github.com/apollographql/apollo-client/issues/1741 [burdon] Resolved
// https://github.com/apollographql/apollo-client/issues/1708 [burdon] Resolved
// https://github.com/apollographql/react-apollo/issues/386

//
// TODO(burdon): Update API fragments and use here (maintain independent fragment testing also).
// http://graphql.org/learn/queries/#fragments
// http://graphql.org/learn/queries/#inline-fragments
//

const ItemFragment = gql`
  fragment ItemFragment on Item {
    bucket
    type
    id 
    version
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

const ProjectFragment = gql`
  fragment ProjectFragment on Project {
    ...ItemFragment
    
    tasks {
      id
    }
  }

  ${ItemFragment}
`;

const ProjectTasksFragment = gql`
  fragment ProjectTasksFragment on Project {
    ...ItemFragment
    
    tasks {
      ...TaskFragment
    }
  }

  ${ItemFragment}
  ${TaskFragment}
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
      ...ProjectTasksFragment
    } 
  }

  ${ProjectTasksFragment}
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

const fragments = new FragmentsMap()
  .add(ItemFragment)
  .add(ProjectFragment)
  .add(ProjectTasksFragment)
  .add(TaskFragment);


describe('End-to-end Apollo-GraphQL Resolver:', () => {

  const idGenerator = new IdGenerator();

  const testData = new TestData(TEST_DATA);

  const bucket = testData.context.buckets[0];

  function getStoreData(client) {
    // The store field is not defined until the first query.
    return client.store && client.store.getState()['apollo'].data || {};
  }

  // Wrap mutate method.
  // NOTE: Avoids dependency on (apollo-react) graphql. Wraps mutate method from options.
  // http://dev.apollodata.com/react/api-graphql.html
  // http://dev.apollodata.com/core/apollo-client-api.html#ApolloClient.mutate
  const mutate = (client) => ({ variables, optimisticResponse, update }) => {
    logger.trace('Store =', JSON.stringify(getStoreData(client), null, 2));

    return client.mutate({
      mutation: BatchMutation,
      variables,
      optimisticResponse,
      update
    });
  };

  let client;

  let networkInterface;

  //
  // Recreate database before each test.
  //
  beforeEach(() => {

    // In-memory database.
    let database = DatabaseUtil.createDatabase();

    // Actual API resolvers.
    let schema = SchemaUtil.createSchema(database);

    // Local network.
    networkInterface = new LocalNetworkInterface(schema, testData.context);

    // Apollo client.
    // http://dev.apollodata.com/core/apollo-client-api.html#apollo-client
    // TODO(burdon): Factor out factory.
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

  //
  // Basic sanity test.
  //
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

  //
  // Basic query/mutation.
  //
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

    // Query item from cache.
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
      mutation: BatchMutation,
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

    let { data: { batchMutation } } = mutationResult;
    expect(batchMutation.keys.length).toEqual(1);

    // Get cached item directly from store.
    // http://dev.apollodata.com/core/apollo-client-api.html#ApolloClient.readQuery
    let { item:cachedItem } = client.readQuery({
      query: ItemQuery,
      variables: {
        key: ID.key(items[0])
      }
    });

    // TODO(burdon): Test versions.
    expect(cachedItem.id).toEqual(batchMutation.keys[0].id);
  });

  //
  // Update cache.
  //
  test('Optimistic update.', async () => {
    let mutatedItem;

    const title = 'Updated Task';
    const taskKey = { bucket, type: 'Task', id: 'T-1' };

    {
      let { data: { item } } = await client.query({
        query: TaskQuery,
        variables: {
          key: taskKey
        }
      });

      // Change fields (clone item since it's immutable).
      mutatedItem = Transforms.applyObjectMutations({}, TypeUtil.clone(item), [
        MutationUtil.createFieldMutation('title', 'string', title),
        MutationUtil.createFieldMutation('status', 'int', 1)
      ]);

      expect(networkInterface.count).toEqual(1);
    }

    {
      // Update item in cache.
      // http://dev.apollodata.com/core/apollo-client-api.html#ApolloClient.writeFragment
      client.writeFragment({
        id: ID.createStoreId(taskKey),
        fragment: TaskFragment,
        fragmentName: FragmentsMap.getFragmentName(TaskFragment),
        data: mutatedItem
      });

      let taskFragment = client.readFragment({
        id: ID.createStoreId(taskKey),
        fragment: TaskFragment,
        fragmentName: FragmentsMap.getFragmentName(TaskFragment)
      });

      // Only updates the fields named in the fragment (i.e., status).
      expect(taskFragment.title).toEqual(title);

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

  //
  // Mutate and write to cache updating nested queries.
  //
  test('Update nested queries.', async () => {

    const projectKey = { bucket, type: 'Project', id: 'P-1' };

    // Query Project.
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
    let mutatedTask = Transforms.applyObjectMutations({}, TypeUtil.clone(task), [
      MutationUtil.createFieldMutation('title', 'string', title),
      MutationUtil.createFieldMutation('status', 'int', 1)
    ]);

    // Write mutated Task to cache.
    client.writeFragment({
      id: ID.createStoreId(task),
      fragment: TaskFragment,
      fragmentName: FragmentsMap.getFragmentName(TaskFragment),
      data: mutatedTask
    });

    // Read Task from cache.
    let cachedTask = client.readFragment({
      id: ID.createStoreId(task),
      fragment: TaskFragment,
      fragmentName: FragmentsMap.getFragmentName(TaskFragment)
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

  //
  // Mutaiton to create Task and insert into Project.
  //
  test('Insert into Project.', async () => {

    const projectKey = { bucket, type: 'Project', id: 'P-1' };
    const title = 'New Task';

    // Query Project.
    let { data: { item:project }} = await client.query({
      query: ProjectQuery,
      variables: {
        key: projectKey
      }
    });

    // Create Task.
    let task = {
      __typename: 'Task',
      bucket: project.bucket,
      type: 'Task',
      id: 'T-4',
      version: 0,
      title: title,
      status: 1
    };

    // Write Task to cache.
    client.writeFragment({
      id: ID.createStoreId(task),
      fragment: TaskFragment,
      fragmentName: FragmentsMap.getFragmentName(TaskFragment),
      data: task
    });

    // Add to Project.
    let mutatedProject = TypeUtil.clone(project);
    mutatedProject.tasks.push(task);

    // Write Project to cache.
    client.writeFragment({
      id: ID.createStoreId(project),
      fragment: ProjectFragment,
      fragmentName: FragmentsMap.getFragmentName(ProjectFragment),
      data: mutatedProject
    });

    // Read from cache.
    let cachedProject = client.readFragment({
      id: ID.createStoreId(project),
      fragment: ProjectFragment,
      fragmentName: FragmentsMap.getFragmentName(ProjectFragment)
    });
    expect(cachedProject.tasks.length).toEqual(project.tasks.length + 1);

    // Read different fragment (check also updated).
    cachedProject = client.readFragment({
      id: ID.createStoreId(project),
      fragment: ProjectTasksFragment,
      fragmentName: FragmentsMap.getFragmentName(ProjectTasksFragment)
    });
    expect(cachedProject.tasks.length).toEqual(project.tasks.length + 1);
    expect(cachedProject.tasks[cachedProject.tasks.length - 1].title).toEqual(title);
  });

  //
  // Batch API.
  //
  test('Batch create item.', async () => {

    let batch = new Batch(idGenerator, mutate(client), fragments, bucket)
      .createItem('Task', [
        MutationUtil.createFieldMutation('title', 'string', 'New Task'),
        MutationUtil.createFieldMutation('status', 'int', 0)
      ], 'task');

    return batch.commit().then(({ batch, error }) => {
      let taskId = ID.createStoreId(batch.refs['task']);

      // Read from cache (should have been updated by batch).
      let cachedTask = client.readFragment({
        id: taskId,
        fragment: TaskFragment,
        fragmentName: FragmentsMap.getFragmentName(TaskFragment)
      });

      let storeItem = getStoreData(client)[taskId];
      expect(storeItem).toEqual(cachedTask);
    });
  });

  //
  // Batch add Task to Project.
  //
  test('Batch create and insert item.', async () => {

    const projectKey = ID.key({ bucket, type: 'Project', id: 'P-1' });

    // Query for existing Project.
    let { data: { item:project } } = await client.query({
      query: ProjectQuery,
      variables: {
        key: projectKey
      }
    });

    let cachedProject = client.readFragment({
      id: ID.createStoreId(project),
      fragment: ProjectTasksFragment,
      fragmentName: FragmentsMap.getFragmentName(ProjectTasksFragment)
    });

    // Sanity check cache is consistent.
    expect(cachedProject.tasks.length).toEqual(project.tasks.length);

    // Create task and add to project.
    let batch = new Batch(idGenerator, mutate(client), fragments, bucket)
      .createItem('Task', [
        MutationUtil.createFieldMutation('title', 'string', 'New Task'),
        MutationUtil.createFieldMutation('status', 'int', 0)
      ], 'task')
      .updateItem(project, [
        ({ task }) => MutationUtil.createSetMutation('tasks', 'key', ID.key(task))
      ]);

    return batch.commit().then(({ batch, error }) => {
      let taskId = ID.createStoreId(batch.refs['task']);

      // Get cache Project and check Tasks were added.
      let cachedProject = client.readFragment({
        id: ID.createStoreId(project),
        fragment: ProjectTasksFragment,
        fragmentName: FragmentsMap.getFragmentName(ProjectTasksFragment)
      });

      expect(cachedProject.tasks.length).toEqual(project.tasks.length + 1);
      expect(ID.createStoreId(cachedProject.tasks[cachedProject.tasks.length - 1])).toEqual(taskId);

      // Test query returns the correct Tasks.
      let { item:updatedProject } = client.readQuery({
        query: ProjectQuery,
        variables: {
          key: projectKey
        }
      });

      expect(updatedProject.tasks.length).toEqual(project.tasks.length + 1);
    });
  });
});

// TODO(burdon): Test read/write fragments with missing field warnings.