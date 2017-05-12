//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';
import React from 'react';
import { connect } from 'react-redux';
import { createMemoryHistory, Route, Router } from 'react-router';
import { applyMiddleware, combineReducers, compose, createStore } from 'redux';
import thunk from 'redux-thunk';
import { routerMiddleware, routerReducer } from 'react-router-redux';
import { graphql, ApolloProvider } from 'react-apollo';
import ApolloClient from 'apollo-client';
import { createNetworkInterface } from 'apollo-client';
import update from 'immutability-helper';

import { TypeUtil } from 'alien-util';
import { AuthDefs, ID, IdGenerator, ItemUtil, MutationUtil, Transforms } from 'alien-core';

import { ReactUtil } from '../../../util/index';

import { ProjectsQuery, ProjectsQueryName, UpsertItemsMutation, UpsertItemsMutationName } from './common';
import { TestingNetworkInterface } from './testing';

import './apollo.less';

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

// TODO(burdon): Network delay for server network interface.
// TODO(burdon): Subscriptions.
// TODO(burdon): Version numbers (inc. on server).

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
    console.log('componentWillReceiveProps:', TypeUtil.stringify(nextProps));
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

  handleInsert(event) {
    let { project, createBatch } = this.props;
    let { text } = this.state;
    let bucket = _.get(project, 'group.id');
    if (text) {
      createBatch(bucket)
        .createItem('Task', [
          MutationUtil.createFieldMutation('title', 'string', text)
        ], 'x')
        .updateItem(project, [
          Batch.ref('x', item => MutationUtil.createSetMutation('tasks', 'id', item.id))
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
      let { items, text } = this.state;
      console.log('RootComponent.render', _.size(items));

      return (
        <div className="test-component">

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

                  <i className="material-icons" onClick={ this.handleUpdate.bind(this, item) }>save</i>
                </div>
              ))}

            </div>
          </div>

          <div className="test-footer">
            <div className="test-expand">Render: { ++this.count }</div>
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
      let { items } = this.props;

      return (
        <div className="test-component">
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
    let { reducer, optimisticResponse, networkDelay } = options;

    return (
      <div className="test-component">
        <div>
          <label>
            <input type="checkbox" onChange={ this.handleOptionsUpdate.bind(this, 'reducer') }
                   checked={ reducer }/> Reducer.
          </label>
        </div>
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

const ProjectReducer = (path, options={}) => (previousResult, action, variables) => {
  // const tasksReducer = ListReducer(path + '[0].tasks', options);

  // Isolate mutations.
  if (action.type === 'APOLLO_MUTATION_RESULT' &&
    action.operationName === UpsertItemsMutationName && options.reducer) {


    // TODO(burdon): The action contains the optimistic result for the project (with task IDs).
    // Path the previous result with the Task (which should also be in this action).
    console.log('##### RES', JSON.stringify(action.result, null, 2));

    
    // Compound reducer.
    // return tasksReducer(previousResult, action, variables);
  }

  return previousResult;
};

/*
const ListReducer = (path, options={}) => (previousResult, action, variables) => {

  // Isolate mutations.
  if (action.type === 'APOLLO_MUTATION_RESULT' &&
    action.operationName === UpsertItemsMutationName && options.reducer) {
    let { upsertItems } = action.result.data;
    let currentItems = _.get(previousResult, path);

    // TODO(burdon): Test belongs to this list (project mutation should happen first)? Batch?

    // Append.
    // TODO(burdon): Test for removal (matcher).
    // TODO(burdon): Sort order.
    let appendItems =
      _.filter(upsertItems, item => !_.find(currentItems, currentItem => currentItem.id === item.id));

    if (!_.isEmpty(appendItems)) {

      // https://github.com/kolodny/immutability-helper
      let tranform = _.set({}, path, {
        $push: appendItems
      });

      return update(previousResult, tranform);
    }
  }

  return previousResult;
};
*/

//-------------------------------------------------------------------------------------------------
// Batch
//-------------------------------------------------------------------------------------------------

// TODO(burdon): Unit test.

class Batch {

  /**
   * Creates a generator that will be called with the ID of the referenced item to create the mutation.
   * @param {string} label
   * @param {function({Item})} callback Callback returns a {Mutation}.
   */
  static ref(label, callback) {
    return (batch) => {
      let itemId = batch._refs.get(label);
      console.assert(itemId);
      let item = batch._items.get(itemId);
      console.assert(item);
      return callback(item);
    };
  }

  /**
   * Do NOT create directly.
   * @param {function} mutate Mutate function provided by Apollo.
   * @param {string} bucket All batched operations must belong to the same bucket.
   * @param {boolean} optimistic
   * @private
   */
  constructor(mutate, bucket, optimistic=false) {
    this._mutate = mutate;
    this._bucket = bucket;
    this._optimistic = optimistic;
    this._refs = new Map();
    this._items = new Map();
    this._mutations = [];
  }

  /**
   * Create a new item.
   * @param {string} type Item type.
   * @param {[{Mutation}]} mutations Mutations to apply.
   * @param {string} ref Optional label that can be used as a reference for subsequent batch operations.
   * @returns {Batch}
   */
  createItem(type, mutations, ref=undefined) {
    console.assert(type && mutations);
    let itemId = idGenerator.createId();
    this._items.set(itemId, { type, id: itemId });

    // TODO(burdon): Remove from client (when transplant to current app).
    // TODO(burdon): Enforce server-side (and/or move into schema proto).
    mutations.unshift(
      MutationUtil.createFieldMutation('bucket', 'string', this._bucket),
      MutationUtil.createFieldMutation('type', 'string', type)
    );

    this._mutations.push({
      bucket: this._bucket,
      itemId: ID.toGlobalId(type, itemId),
      mutations
    });

    if (ref) {
      this._refs.set(ref, itemId);
    }

    return this;
  }

  /**
   * Update an existing item.
   * @param {Item} item Item to mutate.
   * @param {[{Mutation}]} mutations Mutations to apply.
   * @returns {Batch}
   */
  updateItem(item, mutations) {
    console.assert(item && mutations);
    this._items.set(item.id, item);

    this._mutations.push({
      bucket: this._bucket,
      itemId: ID.toGlobalId(item.type, item.id),
      mutations: _.map(mutations, mutation => {
        if (_.isFunction(mutation)) {
          return mutation(this);
        } else {
          return mutation;
        }
      })
    });

    return this;
  }

  /**
   * Commit all changes.
   */
  commit() {

    // Create optimistic response.
    let optimisticResponse = undefined;
    if (this._optimistic) {

      // Apply the mutations to the current (cloned) items.
      let upsertItems = _.map(this._mutations, mutation => {
        let { itemId, mutations } = mutation;
        let { id } = ID.fromGlobalId(itemId);
        let item = this._items.get(id);
        console.assert(item);

        // Patch IDs with items.
        // Clone mutations, iterate tree and replace id with object value.
        // NOTE: This isn't 100% clean since theoretically some value mutations may legitimately deal with IDs.
        // May need to "mark" ID values when set in batch mutation API call.
        let clonedMutations = _.cloneDeep(mutations);
        TypeUtil.traverse(clonedMutations, (value, key, root) => {
          if (key === 'id') {
            let referencedItem = this._items.get(value);
            if (referencedItem) {
              root[key] = referencedItem;
            }
          }
        });

        // http://dev.apollodata.com/react/optimistic-ui.html
        // http://dev.apollodata.com/react/api-mutations.html#graphql-mutation-options-optimisticResponse
        // http://dev.apollodata.com/react/api-mutations.html#graphql-mutation-options-update
        let updatedItem = Transforms.applyObjectMutations(_.cloneDeep(item), clonedMutations);

        // Update the batch's cache for patching above.
        this._items.set(item.id, updatedItem);

        // Important for update.
        _.assign(updatedItem, {
          __typename: item.type
        });

        return updatedItem;
      });

      optimisticResponse = {
        upsertItems
      };

      console.log('##### OPT #####\n', JSON.stringify(optimisticResponse, null, 2));
    }

    // Submit mutation.
    this._mutate({
      variables: {
        mutations: this._mutations
      },

      optimisticResponse
    });
  }
}

//-------------------------------------------------------------------------------------------------
// Apollo Container.
// http://dev.apollodata.com/react/api-queries.html
//-------------------------------------------------------------------------------------------------

const ListComponentWithApollo = compose(

  connect((state, ownProps) => {
    let { options } = AppState(state);
    return {
      options
    };
  }),

  // http://dev.apollodata.com/react/queries.html
  graphql(ProjectsQuery, {

    // http://dev.apollodata.com/react/api-mutations.html#graphql-mutation-options-update

    // http://dev.apollodata.com/react/queries.html#graphql-options
    options: (props) => {
      let { options } = props;
      console.log('graphql.options:', ProjectsQueryName);

      return {
        variables: {
          filter: ProjectFilter
        },

        // http://dev.apollodata.com/react/api-queries.html#graphql-config-options-fetchPolicy
//      fetchPolicy: 'network-only',

        // http://dev.apollodata.com/react/cache-updates.html#resultReducers
        reducer: ProjectReducer('search.items', options)
      };
    },

    // http://dev.apollodata.com/react/api-queries.html#graphql-query-options
    // http://dev.apollodata.com/react/queries.html#graphql-skip

    // http://dev.apollodata.com/react/queries.html#graphql-props-option
    props: ({ ownProps, data }) => {
      let { errors, loading, search } = data;
      console.log('graphql.props:', ProjectsQueryName, loading ? 'loading...' : TypeUtil.stringify(search));

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
        return new Batch(mutate, bucket, ownProps.options.optimisticResponse);
      }
    })
  })

)(ListComponent);

const SimpleListComponentWithApollo = compose(

  // http://dev.apollodata.com/react/queries.html
  graphql(ProjectsQuery, {

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
      console.log('AppReducer: ' + JSON.stringify(action));
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

  constructor(config) {
    console.assert(config);
    this._config = config;
  }

  init() {
    console.log('Initializing...');
    return this.initNetwork().then(() => {
      this.postInit();
      return this;
    });
  }

  initNetwork() {
    switch (_.get(this._config, 'query.network')) {
      case 'testing': {
        this._networkInterface = new TestingNetworkInterface(() => AppState(this._store.getState()));
        return this._networkInterface.init();
      }

      default: {
        this._networkInterface = createNetworkInterface({
          uri: _.get(this._config, 'graphql')
        }).use([
          {
            // http://dev.apollodata.com/core/network.html#networkInterfaceMiddleware
            applyMiddleware: ({ options }, next) => {

              // Set the Auth header.
              options.headers = _.assign(options.headers, {
                'Authorization': AuthDefs.JWT_SCHEME + ' ' + _.get(this._config, 'credentials.id_token')
              });

              next();
            }
          }
        ]);

        return Promise.resolve();
      }
    }
  }

  postInit() {

    //
    // Apollo.
    // https://github.com/apollographql/apollo-client
    //

    // http://dev.apollodata.com/core/apollo-client-api.html#apollo-client
    this._client = new ApolloClient({

      // TODO(burdon): Factor out.
      // Cache normalization (allows for automatic updates to all queries following mutations).
      // Requires mutatied items to include __typename attributes.
      // http://dev.apollodata.com/react/cache-updates.html
      addTypename: true,
      dataIdFromObject: (obj) => {
        if (obj.__typename && obj.id) {
          return obj.__typename + '/' + obj.id;
        }
      },

      // http://dev.apollodata.com/core/network.html#NetworkInterface
      // https://github.com/apollographql/apollo-client/blob/master/src/transport/networkInterface.ts
      networkInterface: this._networkInterface
    });

    //
    // Redux.
    // TODO(burdon): Add Rethunk.
    //

    // Initial options.
    let initialState = {
      options: {
        reducer: false,
        optimisticResponse: true,
        networkDelay: false
      }
    };

    this._history = createMemoryHistory('/');

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
        <Router history={ this._history }>
          <Route path="/" component={ RootComponent }/>
        </Router>
      </ApolloProvider>
    );
  }
}
