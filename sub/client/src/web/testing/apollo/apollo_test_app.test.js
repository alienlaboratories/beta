//
// Copyright 2017 Alien Labs.
//

import ReactDOM from 'react-dom';

import { SchemaUtil } from 'alien-api';
import { Logger, TypeUtil } from 'alien-util';
import { DatabaseUtil, TestData } from 'alien-core/testing';
import TEST_DATA from 'alien-core/src/testing/data/data.json';

import { App } from './apollo';

const logger = Logger.get('test');

/**
 * Smoke test rendering Apollo client app.
 */
test('Renders without crashing.', async () => {

  let data = new TestData(TEST_DATA);
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
    // http://facebook.github.io/jest/docs/tutorial-async.html#content
    // http://github.com/markerikson/redux-ecosystem-links/blob/master/store.md#store-change-subscriptions
    app.store.subscribe(() => {
      logger.log('store.subscription', TypeUtil.stringify(app.store.getState()['apollo'], 2));
    });

    // Render.
    ReactDOM.render(app.root, document.createElement('div'));
  });
});
