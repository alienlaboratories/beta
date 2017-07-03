//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';
import { compose, graphql, ApolloClient, ApolloProvider } from 'react-apollo';
import gql from 'graphql-tag';

import { ID, IdGenerator, Mutator, MutationUtil } from 'alien-core';
import { DatabaseUtil, TestData } from 'alien-core/src/testing';
import { BatchMutation, Fragments, MutationFragmentsMap, SchemaUtil } from 'alien-api';
import { createFragmentMatcher } from 'alien-client';
import { LocalNetworkInterface } from 'alien-client/testing';

import TEST_DATA from 'alien-core/src/testing/data/data.json';

/**
 * Test app.
 */
class TestApp extends React.Component {

  render() {
    this.props.monitor.onRender(this.props);

    return (
      <div>Test</div>
    );
  }
}

const idGenerator = new IdGenerator(1000);

const config = {
  options: {
    optimisticResponse: false
  }
};

const testData = new TestData(TEST_DATA);

const groups = _.map(testData.context.buckets, bucket => ({
  type: 'Group',
  id: bucket
}));

const TestQuery = gql`
  query TestQuery($key: KeyInput!) { 
    item(key: $key) {
      ...ItemFragment
      ...ProjectFragment
      ...ProjectBoardFragment
    } 
  }

  ${Fragments.ItemFragment}
  ${Fragments.ProjectFragment}
  ${Fragments.ProjectBoardFragment}
`;

const ApolloTestApp = compose(

  graphql(BatchMutation, {
    props: ({ ownProps, mutate }) => {
      return {
        mutator: new Mutator(idGenerator, MutationFragmentsMap, [], mutate, config)
      };
    }
  }),

  graphql(TestQuery, {
    options: (props) => {
      return {
        variables: {
          key: ID.key({
            bucket: 'G-1',
            type: 'Project',
            id: 'P-1'
          })
        }
      };
    }
  })

)(TestApp);

// TODO(burdon): Factor out.
const CreateApolloClient = (testData) => {

  // In-memory database.
  let database = DatabaseUtil.createDatabase();

  // Actual API resolvers.
  let schema = SchemaUtil.createSchema(database);

  // Local network.
  let networkInterface = new LocalNetworkInterface(schema, testData.context);

  return DatabaseUtil.init(database, testData.context, testData.itemMap).then(() => {
    return new ApolloClient({
      addTypename: true,
      dataIdFromObject: ID.dataIdFromObject,
      fragmentMatcher: createFragmentMatcher(schema),
      networkInterface
    });
  });
};

describe('End-to-end React-Apollo App.', () => {
  test('Test', async () => {
    let stage = 0;

    return CreateApolloClient(testData).then(client => {
      return new Promise((resolve, reject) => {
        let monitor = {
          onRender: (props) => {
            stage++;

            let { mutator, data: { loading, item:project, variables: { key } } } = props;

            console.log(`### Stage ${stage} ###`, key);
            switch (stage) {

              //
              // Before query.
              //
              case 1: {
                expect(loading).toBeTruthy();

                break;
              }

              //
              // After query.
              //
              /*
              case 2: {
                expect(loading).toBeFalsy();
                expect(project.id).toEqual(key.id);

                // Add task.
                mutator
                  .batch(groups)
                  .createItem('Task', [
                    MutationUtil.createFieldMutation('title', 'string', 'New Task')
                  ], 'task')
                  .updateItem(project, [
                    ({ task }) => MutationUtil.createSetMutation('tasks', 'key', ID.key(task))
                  ])
                  .commit();

                break;
              }
              */

              //
              // After insert task.
              //
              case 2: {
                expect(loading).toBeFalsy();
                expect(project.tasks.length).toEqual(3);

                // Move task.
                mutator
                  .batch(groups)
                  // .createItem('Task', [
                  //   MutationUtil.createFieldMutation('title', 'string', 'New Task')
                  // ], 'task')
                  .updateItem(project, [
                  // ({ task }) => MutationUtil.createSetMutation('tasks', 'key', ID.key(task)),

                    // Add board.
                    // TODO(burdon): Check cache (log batch).
                    {
                      field: 'boards',
                      value: {
                        map: [{
                          predicate: {
                            key: 'alias',
                            value: {
                              string: 'status'
                            }
                          },

                          value: {
                            object: [{
                              field: 'title',
                              value: {
                                string: 'Status'
                              }
                            }]
                          }
                        }]
                      }
                    }

//                  MutationUtil.createProjectBoardMutation('status', 'Active', project.tasks[0].id, 0)
                  ])
                  .commit();

                break;
              }

              //
              // After move.
              //
              case 3: {
                expect(loading).toBeFalsy();

                // TODO(burdon): Batch/Mutation.
                // https://github.com/apollographql/apollo-client/issues/1830
                expect(project.tasks.length).toEqual(3);

                resolve();
                break;
              }
            }
          }
        };

        let App = (
          <ApolloProvider client={ client }>
            <ApolloTestApp monitor={ monitor }/>
          </ApolloProvider>
        );

        ReactDOM.render(App, document.createElement('div'));
      });
    });
  });
});
