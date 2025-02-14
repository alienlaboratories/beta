//
// Copyright 2017 Alien Labs.
//

import React from 'react';
import ReactDOM from 'react-dom';
import { syncHistoryWithStore, routerMiddleware, routerReducer } from 'react-router-redux';
import { applyMiddleware, combineReducers, compose, createStore } from 'redux';
import ReduxThunk from 'redux-thunk';
import reduceReducers from 'reduce-reducers';
import ApolloClient from 'apollo-client';
import moment from 'moment';

import { ErrorUtil, EventListener, Logger, Injector, TypeUtil } from 'alien-util';
import { ID, IdGenerator, Matcher, QueryParser, QueryRegistry } from 'alien-core';
import { ITEM_TYPES } from 'alien-api';

import { createFragmentMatcher} from '../../util/apollo_tools';
import { Loggly } from '../util/loggly';

import { Actions } from './actions';
import { Analytics } from './analytics';
import { ContextManager } from './context';

const logger = Logger.get('app');

/**
 * Base class for all Alien (Apollo) apps.
 *
 * This is the App's top-level class hat configures the Injector, Apollo, Redux reducers, Router, etc.
 * It also renders the App's top-level React component, which defines the react-router Routes.
 */
export class BaseApp {

  constructor(config) {
    console.assert(config);
    this._config = config;

    this._initialized = false;

    // Event bus propagates events (e.g., error messages) to components.
    this._eventListener = new EventListener();

    // TODO(burdon): Experimental (replace with Apollo directives).
    // Manages Apollo query subscriptions.
    this._queryRegistry = new QueryRegistry(this._config);

    // TODO(burdon): Runtime option. This currently breaks if null.
    this._analytics = new Analytics(this._config); // new SegmentAnalytics(this._config);

    // Loggly.
    this._logger = new Loggly(this._config);
    this._logger.log('Starting');

    // Global error handling.
    ErrorUtil.handleErrors(window, error => this.onError(error));

    // Debugging.
    // TODO(burdon): Factor out debug root.
    _.defaultsDeep(window, {
      alien: {
        app: this
      }
    });
  }

  get initialized() {
    return this._initialized;
  }

  onError(error) {
    logger.error(error);
    let message = ErrorUtil.message(error);
    this._eventListener.emit({
      type: 'error',
      error
    });

    this._analytics.track('error', { message });
  }

  /**
   * Initialize everything.
   *
   * @return {Promise}
   */
  init() {
    logger.log('Initializing...');

    // Invoke sequentially.
    return Promise.resolve()
      .then(() => this.initInjector())
      .then(() => this.initNetwork())
      .then(() => this.initApollo())
      .then(() => this.initReduxStore())
      .then(() => this.initRouter())
      .then(() => this.postInit())
      .then(() => {
        logger.info('Config = ' + TypeUtil.stringify(this._config, 2));
        this._initialized = true;
        return this;
      });
  }

  /**
   *
   * @return {Promise}
   */
  postInit() {}

  /**
   * Injectors.
   */
  initInjector() {
    let idGenerator = new IdGenerator();

    let providers = _.concat([
      Injector.provide(this._analytics, Analytics.INJECTOR_KEY),
      Injector.provide(idGenerator),
      Injector.provide(new Matcher()),
      Injector.provide(new QueryParser()),
      Injector.provide(new ContextManager(idGenerator)),
      Injector.provide(new Actions((action) => this.store.dispatch(action), this._queryRegistry)),
      Injector.provide(this._eventListener),
      Injector.provide(this._queryRegistry),
    ], this.providers);

    // TODO(burdon): Move to Redux?
    this._injector = new Injector(providers);
  }

  /**
   * Initialize the Apollo network interface.
   * @return {Promise}
   */
  initNetwork() {}

  /**
   * Apollo client.
   */
  initApollo() {
    console.assert(this.networkInterface);

    //
    // http://dev.apollodata.com/react/initialization.html
    // http://dev.apollodata.com/core/apollo-client-api.html#apollo-client
    // https://github.com/apollostack/apollo-client/blob/6b6e8ded1e0f83cb134d2261a3cf7d2d9416400f/src/ApolloClient.ts
    // NOTE: window.__APOLLO_CLIENT__
    //

    this._client = new ApolloClient({

      // Adds __typename to results.
      addTypename: true,

      // http://dev.apollodata.com/react/cache-updates.html
      dataIdFromObject: ID.dataIdFromObject,

      // Support validation for fragments of interfaces.
      // Otherwise: WARNING: heuristic fragment matching going on!
      // http://dev.apollodata.com/react/initialization.html#fragment-matcher
      fragmentMatcher: createFragmentMatcher(ITEM_TYPES),

      // Map identical queries to the same request.
      // http://dev.apollodata.com/core/network.html#query-deduplication
      queryDeduplication: true,

      // http://dev.apollodata.com/core/network.html
      networkInterface: this.networkInterface,

      // https://github.com/apollographql/apollo-client-devtools
      // https://github.com/apollographql/apollo-client-devtools/issues/29
      // https://chrome.google.com/webstore/detail/apollo-client-developer-t/jdkknkkbebbapilgoeccciglkfbmbnfm
      connectToDevTools: true,

      // TODO(burdon): Change ID to key.
      // Custom resolver (items are resolved from the cache).
      // http://dev.apollodata.com/react/cache-updates.html#cacheRedirect
      // https://github.com/apollographql/apollo-client/blob/a86acf25df5eaf0fdaab264fd16c2ed22657e65c/test/customResolvers.ts
      // https://github.com/apollographql/apollo-client/blob/6b6e8ded1e0f83cb134d2261a3cf7d2d9416400f/src/data/storeUtils.ts
      // customResolvers: {
      //   RootQuery: {                // Root query type name.
      //     item: (_, args) => {
      //       // toIdValue(dataIdFromObject({ __typename: 'book', id: args['id'] })),
      //       return {
      //         type: 'id',
      //         id: args['itemId']    // GraphQL query-soecific.
      //       };
      //     }
      //   }
      // }
    });
  }

  /**
   * Redux store.
   *
   * http://dev.apollodata.com/react/redux.html
   * https://github.com/reactjs/react-redux
   * https://github.com/reactjs/redux/blob/master/docs/api/createStore.md
   */
  initReduxStore() {

    // Redux Reducers (Action handlers.)
    // NOTE: All reducers receive ALL application actions.
    // http://redux.js.org/docs/basics/Reducers.html

    // The Global reducer can access the entire state.
    // We use this to listen for specific Apollo actions and update the app's state (e.g., Navbar).
    // https://apollographql.slack.com/archives/general/p1487786940010712 (help from @pleunv).
    let global = this.globalReducer;

    // Combines system (Apollo, React Router) reducers with app-specific state reducers.
    // http://redux.js.org/docs/api/combineReducers.html
    let merged = combineReducers(_.merge(this.reducers, {

      //
      // React Redux Router.
      //
      routing: routerReducer,

      //
      // Apollo framework reducer.
      // https://dev-blog.apollodata.com/apollo-client-graphql-with-react-and-redux-49b35d0f2641#.6s4uu9s2b
      //
      // State: { apollo }
      // {
      //   queries:   query state.
      //   data:      cached items.
      // }
      //
      // TODO(burdon): Updating the cache.
      // https://github.com/apollographql/apollo-client/issues/180
      // https://www.learnapollo.com/excursions/excursion-02/
      //
      apollo: this._client.reducer(),
    }));

    // https://github.com/acdlite/reduce-reducers
    // https://github.com/reactjs/redux/issues/749
    let reducers = global ? reduceReducers(merged, global) : merged;

    let enhancers = _.compact([

      // Redux-thunk (for asynchronous actions).
      // NOTE: The arg is passed as the third arg to the redux handler:
      // () => (dispatch, getState, injector) => { ... }
      applyMiddleware(ReduxThunk.withExtraArgument(this._injector)),

      // Enable navigation via redux dispatch.
      // https://github.com/reactjs/react-router-redux#what-if-i-want-to-issue-navigation-events-via-redux-actions
      // https://github.com/reactjs/react-router-redux#pushlocation-replacelocation-gonumber-goback-goforward
      applyMiddleware(routerMiddleware(this.history)),

      // Apollo-Redux bindings.
      applyMiddleware(this._client.middleware()),

      // TODO(burdon): Debug only.
      // https://github.com/zalmoxisus/redux-devtools-extension
      // https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd
      window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
    ]);

    // Enhance the store.
    // https://github.com/reactjs/redux/blob/master/docs/Glossary.md#store-enhancer
    let enhancer = compose(...enhancers);

    // http://redux.js.org/docs/api/createStore.html
    this._store = createStore(reducers, enhancer);
  }

  /**
   * React router.
   */
  initRouter() {
    this.history.listen(location => {
      logger.log('Router: ' + location.pathname);
      this._analytics.pageview(location);
    });
  }

  /**
   * Flush the cache and reset the Apollo store.
   */
  resetStore() {
    logger.warn('Resetting store...');

    // Reset store (causes queries to update).
    // https://github.com/apollostack/apollo-client/blob/6b6e8ded1e0f83cb134d2261a3cf7d2d9416400f/src/ApolloClient.ts
    this._client.resetStore();
  }

  /**
   * Dependency injector.
   * @return {Injector}
   */
  get injector() {
    return this._injector;
  }
  
  /**
   * Access config.
   */
  get config() {
    return this._config;
  }

  /**
   * Redux store (for dispatching actions).
   */
  get store() {
    return this._store;
  }

  /**
   * Apollo client.
   * @return {ApolloClient}
   */
  get client() {
    return this._client;
  }

  //
  // Virtual methods.
  //

  /**
   * Returns the Apollo network interface.
   */
  get networkInterface() {
    return null;
  }

  /**
   * Local item store.
   * @returns {ItemStore}
   */
  get itemStore() {
    return null;
  }

  /**
   * React router history.
   */
  get history() {
    return null;
  }

  /**
   * Global reducer for reduce-reducers.
   */
  get globalReducer() {
    return null;
  }

  /**
   * App-specific Redux reducers.
   */
  get reducers() {
    return {};
  }

  /**
   * App-specific injector proviers.
   */
  get providers() {
    return [];
  }

  /**
   * Renders the root application.
   *
   * <Application injector={} client={} state={} history={}>
   *   <ApolloProvider client={} store={}>
   *     <Router history={}>
   *       <Route path="/activity" component={ Activity }/>
   *     </Router>
   *   </ApolloProvider
   * </Application>
   *
   * Routes instantiate activity components, which receive params from the path.
   *
   * @param {React.Component} App Root app class.
   * @return {Promise}
   */
  render(App) {
    logger.info(`### [${moment().format('YYYY-MM-DD HH:mm Z')} ${_.get(this._config, 'env')}] ###`);

    // Enhanced history that syncs navigation events with the store.
    // https://github.com/reactjs/react-router-redux
    let history = syncHistoryWithStore(this.history, this.store);

    // Construct app.
    const app = (
      // TODO(burdon): Get injector from redux store?
      <App
        injector={ this.injector }
        client={ this.client }
        store={ this.store }
        history={ history }/>
    );

    // Render app.
    return new Promise((resolve, reject) => {
      let root = document.getElementById(this._config.root);
      ReactDOM.render(app, root, () => {
        resolve(root);
      });
    });
  }
}
