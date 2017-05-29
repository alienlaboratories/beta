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
import { Batch, Fragments, IdGenerator, ItemUtil, MutationUtil } from 'alien-core';
import { ITEM_TYPES, UpsertItemsMutation, UpsertItemsMutationName } from 'alien-core';

import { createFragmentMatcher } from '../../../util/apollo_tools';
import { createNetworkInterfaceWithAuth, LocalNetworkInterface } from '../../../testing/apollo_testing';

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

  constructor() {
    super(...arguments);

    this.state = {
      text: '',
      items: _.map(this.props.items, item => _.cloneDeep(item))
    };
  }

  // TODO(burdon): Dispatch redux action.

  componentWillReceiveProps(nextProps) {
//  logger.log('componentWillReceiveProps:', TypeUtil.stringify(nextProps));
    this.setState({
      items: _.map(nextProps.items, item => _.cloneDeep(item))
    });
  }

  handleTextChange(event) {
    let { items } = this.state;
    let itemMap = ItemUtil.createItemMap(items);
    let itemId = $(event.target).attr('data');
    let item = itemMap.get(itemId);

    if (item) {
      item.title = event.target.value;
      this.forceUpdate();
    } else {
      this.setState({
        text: event.target.value
      });
    }
  }

  handleUpdate(item, event) {
    let { project, createBatch } = this.props;
    let bucket = _.get(project, 'group.id');
    let input = this.refs['INPUT/' + item.id];
    let text = $(input).val();
    if (text) {
      createBatch(bucket)
        .updateItem(item, [
          MutationUtil.createFieldMutation('title', 'string', text)
        ])
        .commit();
    }

    input.focus();
  }

  handleDelete(item, event) {
    let { project, createBatch } = this.props;
    let bucket = _.get(project, 'group.id');

    createBatch(bucket)
      .updateItem(project, [
        MutationUtil.createSetMutation('tasks', 'id', item.id, false)
      ])
      .commit();
  }

  handleInsert(event) {
    let { config, project, createBatch } = this.props;
    let { text } = this.state;
    let bucket = _.get(project, 'group.id');
    if (text) {
      // TODO(burdon): For item creation (per-type validation).
      let userId = _.get(config, 'userProfile.id');
      console.assert(userId);

      createBatch(bucket)
        .createItem('Task', [
          MutationUtil.createFieldMutation('owner', 'id', userId),
          MutationUtil.createFieldMutation('title', 'string', text)
        ], 'task')
        .updateItem(project, [
          ({ task }) => MutationUtil.createSetMutation('tasks', 'id', task.id)
        ])
        .commit();

      this.setState({
        text: ''
      });
    }

    this.refs['INPUT_NEW'].focus();
  }

  handleRefetch() {
    this.props.refetch();
  }

  render() {
    return ReactUtil.render(this, () => {
      let { project } = this.props;
      let { items, text } = this.state;
      this.count++;

      logger.log('RootComponent.render', _.size(items));
      console.log('####', this.props);

      if (!project) {
        logger.warn('Null project.');
        return <div/>;
      }

      return (
        <div className="test-component">

          <h3>{ project.title }</h3>

          <div className="test-header">
            <input ref="INPUT_NEW" type="text" value={ text } autoFocus={ true } spellCheck={ false }
                   onChange={ this.handleTextChange.bind(this) }/>

            <i className="material-icons" onClick={ this.handleInsert.bind(this) }>add</i>
          </div>

          <div className="test-body">
            <div className="test-list">

              {_.map(items, item => (
                <div className="test-list-item" key={ item.id }>
                  <input ref={ 'INPUT/' + item.id } type="text" data={ item.id } value={ item.title } spellCheck={ false }
                         onChange={ this.handleTextChange.bind(this) }/>

                  <i className="material-icons" onClick={ this.handleDelete.bind(this, item) }>cancel</i>
                  <i className="material-icons" onClick={ this.handleUpdate.bind(this, item) }>save</i>
                </div>
              ))}

            </div>
          </div>

          <div className="test-footer">
            <div className="test-expand">Render: #{ this.count }</div>
            <button>Reset</button>
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
      let { project, items } = this.props;

      if (!project) {
        logger.warn('Null project.');
        return <div/>;
      }

      return (
        <div className="test-component">
          <h3>{ project.title }</h3>

          <div className="test-body">
            {_.map(items, item => (
              <div key={ item.id }>
                <div title={ item.id }>{ item.title }</div>
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
    let { optimisticResponse, networkDelay } = options;

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
                   checked={ networkDelay }/> Network Delay.
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
    action.operationName === UpsertItemsMutationName && options.reducer) {

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

export const SearchQuery = gql`
  query SearchQuery($filter: FilterInput) {
    search(filter: $filter) {
      items {
        ...ItemFragment
        id
        title

        ... on Project {
          group {
            id
            title
          }

          tasks {
            ...ItemFragment

            id
            type
            title                 # TODO(burdon): Breaks if missing.

            ...TaskFragment
          }
        }
      }
    }
  }
  
  ${Fragments.ItemFragment}
  ${Fragments.TaskFragment}
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

      return {
        variables: {
          filter: ProjectFilter
        },

        // http://dev.apollodata.com/react/api-queries.html#graphql-config-options-fetchPolicy
//      fetchPolicy: 'network-only',

        // http://dev.apollodata.com/react/cache-updates.html#resultReducers
        reducer: SearchReducer('search.items', options)
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
  graphql(UpsertItemsMutation, {

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
        return new Batch(idGenerator, mutate, bucket, null, ownProps.options.optimisticResponse);
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
    let { schema, context } = _.get(this._config, 'testing');

    let networkInterface;
    let fragmentMatcher;

    if (schema) {
      networkInterface = new LocalNetworkInterface(schema, context);
      fragmentMatcher = createFragmentMatcher(schema);
    } else {
      networkInterface = createNetworkInterfaceWithAuth(this._config);
      fragmentMatcher = createFragmentMatcher(ITEM_TYPES);
    }

    this._client = new ApolloClient({
      networkInterface,
      fragmentMatcher,

      addTypename: true,                                        // TODO(burdon): ???

      dataIdFromObject: item => item.type + ':' + item.id,
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
        reducer: false,
        optimisticResponse: true,
        networkDelay: true
      }
    };

    // https://github.com/acdlite/reduce-reducers
    const reducers = combineReducers({
      routing: routerReducer,
      apollo: this._client.reducer(),
      [APP_NAMESPACE]: AppReducer(initialState)
    });

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
        <Router history={ hashHistory }>
          <Route path="/" component={ RootComponent }/>
        </Router>
      </ApolloProvider>
    );
  }
}
