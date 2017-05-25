//
// Copyright 2017 Alien Labs.
//

import ReactDOM from 'react-dom';

import { SchemaUtil } from 'alien-api/testing';
import { Logger, TypeUtil } from 'alien-util';
import { ID, MutationUtil, UpsertItemsMutation } from 'alien-core';
import { DatabaseUtil, TestData } from 'alien-core/testing';

import { App, AppTestAction } from './apollo';
import { SearchQuery} from './common';

const logger = Logger.get('test');

test('Renders without crashing.', async () => {

  let data = new TestData();
  let database = await DatabaseUtil.init(DatabaseUtil.createDatabase(), data.context, data.itemMap);
  let schema = SchemaUtil.createSchema(database);

  let config = {
    testing: {
      schema,
      context: data.context
    }
  };

  return new App(config).init().then(app => {

    // Get Redux store updates.
    // http://redux.js.org/docs/api/Store.html#subscribe
    // http://redux.js.org/docs/faq/StoreSetup.html#store-setup-subscriptions
    // https://facebook.github.io/jest/docs/tutorial-async.html#content
    // https://github.com/markerikson/redux-ecosystem-links/blob/master/store.md#store-change-subscriptions
    app.store.subscribe(() => {
      // TODO(burdon): Get Apollo state.
      logger.log('store.subscription', TypeUtil.stringify(app.store.getState()['apollo'], 2));
    });

    // Render.
    ReactDOM.render(app.root, document.createElement('div'));

    // End-to-end unit test.
    // https://github.com/apollographql/react-apollo/tree/master/examples/create-react-app#running-tests

    //
    // Trigger Redux test action.
    // TODO(burdon): Remove (now test_apollo.js)
    //
    let test = false;
    if (test) {
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
                key: ID.key({ bucket: data.context.bucket[0], type: 'Task', id: '123' }),
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
    }
  });
});
