//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';
import React from 'react';
import gql from 'graphql-tag';
import { connect } from 'react-redux';
import { Router, Route } from 'react-router';
import { applyMiddleware, combineReducers, compose, createStore } from 'redux';
import thunk from 'redux-thunk';
import { hashHistory } from 'react-router';
import { routerMiddleware, routerReducer } from 'react-router-redux';
import ApolloClient from 'apollo-client';
import { graphql, ApolloProvider } from 'react-apollo';
import update from 'immutability-helper';

import { Logger, TypeUtil } from 'alien-util';
import { Batch, FragmentsMap, ID, IdGenerator, MutationUtil } from 'alien-core';
import { BatchMutation, BatchMutationName } from 'alien-core';
import { ITEM_TYPES } from 'alien-api';

import { createFragmentMatcher } from '../../../util/apollo_tools';
import { createNetworkInterfaceWithAuth, LocalNetworkInterface } from '../../../testing/apollo_testing';

import { TextBox } from '../../components/textbox';

import { ReactUtil } from '../../util/index';

import './apollo.less';

const logger = Logger.get('apollo');

const idGenerator = new IdGenerator();

const ProjectFilter = {
  type: 'Project',
  expr: {
    comp: 'IN',
    field: 'labels',
    value: {
      string: '_default'
    }
  }
};

//-------------------------------------------------------------------------------------------------
// React Components.
//-------------------------------------------------------------------------------------------------

class ListComponent extends React.Component {

  count = 0;

  handleRefetch() {
    this.props.refetch();
  }

  handleInsert(event) {
    let { config, project, createBatch } = this.props;
    let bucket = _.get(project, 'group.id');

    let text = this.refs['INPUT_NEW'].value;
    if (text) {
      // TODO(burdon): For item creation (per-type validation).
      let userId = _.get(config, 'userProfile.id');
      console.assert(userId);

      createBatch(bucket)
        .createItem('Task', [
          MutationUtil.createFieldMutation('owner', 'key', { type: 'User', id: userId }),
          MutationUtil.createFieldMutation('title', 'string', text),
          MutationUtil.createFieldMutation('status', 'int', 0)
        ], 'task')
        .updateItem(project, [
          ({ task }) => MutationUtil.createSetMutation('tasks', 'key', ID.key(task))
        ])
        .commit();

      this.refs['INPUT_NEW'].clear();
    }

    this.refs['INPUT_NEW'].focus();
  }

  handleDelete(item, event) {
    let { project, createBatch } = this.props;
    let bucket = _.get(project, 'group.id');

    createBatch(bucket)
      .updateItem(project, [
        MutationUtil.createSetMutation('tasks', 'key', ID.key(item), false)
      ])
      .commit();
  }

  handleUpdate(item, event) {
    let { project, createBatch } = this.props;
    let bucket = _.get(project, 'group.id');
    let input = this.refs['INPUT/' + item.id];
    let text = input.value;
    if (text) {
      createBatch(bucket)
        .updateItem(item, [
          MutationUtil.createFieldMutation('title', 'string', text)
        ])
        .commit();
    }

    input.focus();
  }

  render() {
    return ReactUtil.render(this, () => {
      let { project } = this.props;
      let { title, tasks } = project;

      this.count++;

      return (
        <div className="test-component">

          <h3>{ title }</h3>

          <div className="test-header">
            <TextBox ref="INPUT_NEW"/>
            <i className="material-icons" onClick={ this.handleInsert.bind(this) }>add</i>
          </div>

          <div className="test-body">
            <div className="test-list">

              {_.map(tasks, task => (
                <div className="test-list-item" key={ task.id }>
                  <TextBox ref={ 'INPUT/' + task.id } value={ task.title }/>
                  <i className="material-icons" onClick={ this.handleDelete.bind(this, task) }>cancel</i>
                  <i className="material-icons" onClick={ this.handleUpdate.bind(this, task) }>save</i>
                </div>
              ))}

            </div>
          </div>

          <div className="test-footer">
            <div className="test-expand">Render: #{ this.count }</div>
            <button onClick={ this.handleRefetch.bind(this) }>Refetch</button>
          </div>

        </div>
      );
    });
  }
}

class SimpleListComponent extends React.Component {

  render() {
    return ReactUtil.render(this, () => {
      let { project } = this.props;
      let { title, tasks } = project;

      return (
        <div className="test-component">
          <h3>{ title }</h3>

          <div className="test-body">
            {_.map(tasks, task => (
              <div key={ task.id }>
                <div title={ task.id }>{ task.title }</div>
              </div>
            ))}
          </div>
        </div>
      );
    });
  }
}

class OptionsComponent extends React.Component {

  handleOptionsUpdate(param, event) {
    this.props.updateOptions(param, event.target.checked);
  }

  render() {
    let { options={} } = this.props;
    let { debug, optimisticResponse, networkDelay } = options;

    return (
      <div className="test-component">
        <div>
          <label>
            <input type="checkbox" onChange={ this.handleOptionsUpdate.bind(this, 'optimisticResponse') }
                   checked={ optimisticResponse }/> Optimistic responses.
          </label>
        </div>
        <div>
          <label>
            <input type="checkbox" onChange={ this.handleOptionsUpdate.bind(this, 'networkDelay') }
                   checked={ networkDelay }/> Network delay.
          </label>
        </div>
        <div>
          <label>
            <input type="checkbox" onChange={ this.handleOptionsUpdate.bind(this, 'debug') }
                   checked={ debug }/> Debug logging.
          </label>
        </div>
      </div>
    );
  }
}

//-------------------------------------------------------------------------------------------------
// Redux Container.
// https://github.com/reactjs/react-redux/blob/master/docs/api.md
//-------------------------------------------------------------------------------------------------

// TODO(burdon): Read from cache.
// http://dev.apollodata.com/core/apollo-client-api.html#ApolloClient.readQuery

const mapStateToProps = (state, ownProps) => {
  let { options } = AppState(state);
  return {
    options
  };
};

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    updateOptions: (param, value) => {
      dispatch(AppUpdateOptions({
        [param]: value
      }));
    }
  };
};

const OptionsComponentWithRedux = connect(mapStateToProps, mapDispatchToProps)(OptionsComponent);

//-------------------------------------------------------------------------------------------------
// Updating the Cache.
// http://dev.apollodata.com/react/cache-updates.html
// NOTE: Cache normalization ensures that items returned from the mutation (that must include
// the __typname attribute) correctly updates the cache (and automatically updates all queries).
//
// 1). Refetch queries on mutation.
// http://dev.apollodata.com/react/cache-updates.html#refetchQueries
// - mutate({ refetchQueries: [{ query, variables }] })
//
// 2). Add/remove items after mutation (updates should happen automatically via cache normalization).
// http://dev.apollodata.com/react/cache-updates.html#updateQueries
// - mutate({ updateQueries: { Type: (previousResult, { mutationResult }) => {} })
//
// 3). Update query result based on mutation.
// http://dev.apollodata.com/react/cache-updates.html#resultReducers
// - graphql({ options: { reducer: (previousResult, action, variables) => {} } })
//
//-------------------------------------------------------------------------------------------------

const SearchReducer = (path, options={}) => (previousResult, action, variables) => {
  if (action.type === 'APOLLO_MUTATION_RESULT' &&
    action.operationName === BatchMutationName) {

    // NOTE: The reducer isn't necessary for mutations that return full responses (with ID/links, etc.)
    // It is required for search results.
    // It will also be required later when as an optimization, mutation results are not complete
    // (i.e., don't contain full items in fields -- perhaps just returning lists of IDs).

    let updateSpec = {};

    if (!_.isEmpty(updateSpec)) {
      return update(previousResult, updateSpec);
    }
  }

  return previousResult;
};

//-------------------------------------------------------------------------------------------------
// GQL Queries and Mutations.
//-------------------------------------------------------------------------------------------------

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

    group {
      ...ItemFragment
    }
    
    tasks {
      ...TaskFragment
    }
  }

  ${ItemFragment}
  ${TaskFragment}
`;

const fragmentsMap = new FragmentsMap()
  .add(ItemFragment)
  .add(ProjectFragment)
  .add(TaskFragment);

export const SearchQuery = gql`
  query SearchQuery($filter: FilterInput) {
    search(filter: $filter) {
      items {
        ...ProjectFragment
      }
    }
  }

  ${ItemFragment}
  ${ProjectFragment}
`;

export const SearchQueryName = _.get(SearchQuery, 'definitions[0].name.value');

//-------------------------------------------------------------------------------------------------
// Apollo Container.
// http://dev.apollodata.com/react/api-queries.html
//-------------------------------------------------------------------------------------------------

const ListComponentWithApollo = compose(

  // Connect redux properties.
  connect((state, ownProps) => {
    let { config, options } = AppState(state);

    return {
      config,
      options
    };
  }),

  // http://dev.apollodata.com/react/queries.html
  graphql(SearchQuery, {

    // http://dev.apollodata.com/react/api-mutations.html#graphql-mutation-options-update

    // http://dev.apollodata.com/react/queries.html#graphql-options
    options: (props) => {
      let { options } = props;
      logger.log('graphql.options:', SearchQueryName);

      let reducer;
      if (options.reducer) {
        reducer = SearchReducer('search.items');
      }

      return {
        variables: {
          filter: ProjectFilter
        },

        // http://dev.apollodata.com/react/api-queries.html#graphql-config-options-fetchPolicy
//      fetchPolicy: 'network-only',

        // http://dev.apollodata.com/react/cache-updates.html#resultReducers
        reducer
      };
    },

    // http://dev.apollodata.com/react/api-queries.html#graphql-query-options
    // http://dev.apollodata.com/react/queries.html#graphql-skip

    // http://dev.apollodata.com/react/queries.html#graphql-props-option
    props: ({ ownProps, data }) => {
      let { errors, loading, search } = data;
      logger.log('graphql.props:', SearchQueryName, loading ? 'loading...' : TypeUtil.stringify(search));

      let project = _.get(search, 'items[0]');
      let items = _.get(project, 'tasks');

      // Decouple Apollo query/result from component.
      return {
        errors,
        loading,

        project,
        items,

        refetch: () => {
          // NOTE: Doesn't trigger re-render (i.e., HOC observer) unless results change.
          data.refetch();
        }
      };
    }
  }),

  // http://dev.apollodata.com/react/mutations.html
  graphql(BatchMutation, {

    options: {

      // Custom cache update (for particular query; more flexible to use reducer).
      // http://dev.apollodata.com/core/read-and-write.html#updating-the-cache-after-a-mutation
      // http://dev.apollodata.com/react/api-mutations.html#graphql-mutation-options-update
      // update: (proxy, { data }) => {
      // }
    },

    // http://dev.apollodata.com/react/mutations.html#custom-arguments
    props: ({ ownProps, mutate }) => ({

      /**
       * Creates a batch.
       * @param bucket
       * @returns {Batch}
       */
      createBatch: (bucket) => {
        return new Batch(idGenerator, mutate, fragmentsMap, bucket, ownProps.options.optimisticResponse);
      }
    })
  })

)(ListComponent);

const SimpleListComponentWithApollo = compose(

  // http://dev.apollodata.com/react/queries.html
  graphql(SearchQuery, {

    options: (props) => {
      return {
        variables: {
          filter: ProjectFilter
        }
      };
    },

    props: ({ ownProps, data }) => {
      let { errors, loading, search } = data;

      let project = _.get(search, 'items[0]');
      let items = _.get(project, 'tasks');

      return {
        errors,
        loading,

        project,
        items
      };
    }
  })

)(SimpleListComponent);

//-------------------------------------------------------------------------------------------------
// Root Component.
//-------------------------------------------------------------------------------------------------

class RootComponent extends React.Component {

  render() {
    return (
      <div className="test-columns">
        <ListComponentWithApollo/>
        <SimpleListComponentWithApollo/>
        <OptionsComponentWithRedux/>
      </div>
    );
  }
}

//-------------------------------------------------------------------------------------------------
// Redux Reducer.
//-------------------------------------------------------------------------------------------------

const APP_NAMESPACE = 'app';

const APP_UPDATE_OPTIONS = 'APP_UPDATE_OPTIONS';

const AppUpdateOptions = (options) => ({
  type: APP_UPDATE_OPTIONS,
  options
});

// TODO(burdon): Thunk action to insert item (access apollo client directly).
// http://dev.apollodata.com/core/apollo-client-api.html
// https://github.com/gaearon/redux-thunk
export const AppTestAction = (title) => (dispatch, getState) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve({ status: 'OK' });
    });
  }, 100);
};

export const AppState = (state) => state[APP_NAMESPACE];

const AppReducer = (initalState) => (state=initalState, action) => {
  switch (action.type) {
    case APP_UPDATE_OPTIONS: {
      logger.log('AppReducer: ' + JSON.stringify(action));
      let { options } = action;
      return _.merge({}, state, { options });
    }
  }

  return state;
};

//-------------------------------------------------------------------------------------------------
// App
// React-Router-Redux => Apollo => Redux => React.
//-------------------------------------------------------------------------------------------------

export class App {

  constructor(config={}) {
    console.assert(config);
    this._config = config;

    _.defaultsDeep(window, {
      alien: {
        app: this
      }
    });
  }

  init() {
    logger.log('Initializing...');

    this.initClient();
    this.initStore();

    return Promise.resolve(this);
  }

  /**
   * Init Apollo.
   */
  initClient() {
    let { schema, context } = _.get(this._config, 'testing', {});

    let fragmentMatcher;
    let networkInterface;

    if (schema) {
      fragmentMatcher = createFragmentMatcher(schema);
      networkInterface = new LocalNetworkInterface(schema, context, () => {
        let options = _.assign({}, this._store.getState()[APP_NAMESPACE].options);
        options.networkDelay = options.networkDelay ? 2000 : 0;
        return options;
      });
    } else {
      fragmentMatcher = createFragmentMatcher(ITEM_TYPES);
      networkInterface = createNetworkInterfaceWithAuth(this._config);
    }

    this._client = new ApolloClient({
      addTypename: true,                          // For fragment matching.
      dataIdFromObject: ID.dataIdFromObject,

      fragmentMatcher,
      networkInterface
    });
  }

  /**
   * Init Redux.
   */
  initStore() {

    // Initial options.
    let initialState = {

      config: this._config,

      options: {
        debug: false,
        networkDelay: true,
        optimisticResponse: true,
        reducer: false
      }
    };

    // https://github.com/acdlite/reduce-reducers
    const reducers = combineReducers({
      routing: routerReducer,
      apollo: this._client.reducer(),
      [APP_NAMESPACE]: AppReducer(initialState)
    });

    this._history = hashHistory;

    const enhancers = compose(
      applyMiddleware(thunk),
      applyMiddleware(routerMiddleware(this._history)),
      applyMiddleware(this._client.middleware())
    );

    // http://redux.js.org/docs/api/createStore.html
    this._store = createStore(reducers, enhancers);
  }

  get client() {
    return this._client;
  }

  get store() {
    return this._store;
  }

  get root() {
    return (
      <ApolloProvider client={ this._client } store={ this._store }>
        <Router history={ this._history }>
          <Route path="/" component={ RootComponent }/>
        </Router>
      </ApolloProvider>
    );
  }
}
