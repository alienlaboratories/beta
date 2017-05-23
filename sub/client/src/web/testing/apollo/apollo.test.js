//
// Copyright 2017 Alien Labs.
//

import ReactDOM from 'react-dom';

import { ID, MutationUtil, UpsertItemsMutation } from 'alien-core';
import { DatabaseUtil, TestData } from 'alien-core/testing';

import { LocalNetworkInterface } from 'alien-api/src/testing';

import { App, AppState, AppTestAction } from './apollo';
import { SearchQuery} from './common';

// TODO(burdon): Broken.

test('Renders without crashing.', () => {

  let data = new TestData();

  let database = DatabaseUtil.createDatabase();

  let networkInterface = new LocalNetworkInterface(database, {
    userId: data.userId
  });

  // TODO(burdon): Move App.init here?
  let config = {
    testing: {
      networkInterface
    }
  };

  return new App(config).init().then(app => {

    // Get Redux store updates.
    // http://redux.js.org/docs/api/Store.html#subscribe
    // http://redux.js.org/docs/faq/StoreSetup.html#store-setup-subscriptions
    // https://facebook.github.io/jest/docs/tutorial-async.html#content
    // https://github.com/markerikson/redux-ecosystem-links/blob/master/store.md#store-change-subscriptions
    // TODO(burdon): Test update.
    app.store.subscribe(() => {
//    console.log('[[ UPDATE ]]', TypeUtil.stringify(AppState(app.store.getState())));
    });

    // Render.
    ReactDOM.render(app.root, document.createElement('div'));

    // End-to-end unit test.
    // https://github.com/apollographql/react-apollo/tree/master/examples/create-react-app#running-tests

    //
    // Trigger Redux test action.
    //
    return app.store.dispatch(AppTestAction('test')).then(result => {

      //
      // Test Mutation.
      // http://dev.apollodata.com/core/apollo-client-api.html#ApolloClient.mutate
      //
      return app.client.mutate({
        mutation: UpsertItemsMutation,
        variables: {
          itemMutations: [
            {
              key: ID.key({ bucket: data.bucket, type: 'Task', id: '123' }),
              mutations: [
                MutationUtil.createFieldMutation('title', 'string', 'Test Item')
              ]
            }
          ]
        }
      }).then(result => {
        let { upsertItems } = result.data;
        console.assert(_.size(upsertItems) === 1);
        let title = upsertItems[0].title;

        //
        // Test Query.
        // http://dev.apollodata.com/core/apollo-client-api.html#ApolloClient.query
        //
        return app.client.query({
          query: SearchQuery,
          variables: {
            filter: {
              type: 'Project'
            }
          }
        }).then(result => {
          let { search: { items } } = result.data;
          let item = _.find(items, item => item.title === title);
          console.assert(item);
        });
      });
    });
  });
});
