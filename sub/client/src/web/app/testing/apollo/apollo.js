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

import { ProjectsQuery, TestMutation, TestMutationName, TestQuery, TestQueryName } from './common';
import { TestingNetworkInterface } from './testing';

import './apollo.less';

const idGenerator = new IdGenerator();

const filter = { type: 'Task', count: 100 };

// TODO(burdon): Network delay for server network interface.
// TODO(burdon): Link mutations (batch 2 items).
// TODO(burdon): Subscriptions.

//-------------------------------------------------------------------------------------------------
// React Components.
//-------------------------------------------------------------------------------------------------

class ListComponent extends React.Component {

  count = 0;

  constructor() {
    super(...arguments);

    this.state = {
      text: '',
      items: _.map(this.props.items, item => _.clone(item))
    };
  }

  // TODO(burdon): Dispatch redux action.

  componentWillReceiveProps(nextProps) {
    console.log('componentWillReceiveProps:', TypeUtil.stringify(nextProps));
    this.setState({
      items: _.map(nextProps.items, item => _.clone(item))
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
    let { project, updateItem } = this.props;
    let bucket = _.get(project, 'group.id');
    let input = this.refs['INPUT/' + item.id];
    let text = $(input).val();
    if (text) {
      updateItem(item, bucket, [
        MutationUtil.createFieldMutation('type', 'string', filter.type),
        MutationUtil.createFieldMutation('title', 'string', text)
      ]);
    }

    input.focus();
  }

  handleInsert(event) {
    let { project, insertItem } = this.props;
    let { text } = this.state;
    let bucket = _.get(project, 'group.id');
    if (text) {
      insertItem('Task', bucket, [
        MutationUtil.createFieldMutation('bucket', 'string', bucket),
        MutationUtil.createFieldMutation('title', 'string', text)
      ]);

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
              <div key={ item.id }>{ item.title }</div>
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

const ListReducer = (query, path, active=true) => (previousResult, action, variables) => {

  // Isolate mutations.
  if (action.type === 'APOLLO_MUTATION_RESULT' && action.operationName === TestMutationName && active) {
    let { upsertItems } = action.result.data;
    let currentItems = _.get(previousResult, path);

    // Append.
    // TODO(burdon): Sort order.
    // TODO(burdon): Test for removal (matcher).
    let appendItems =
      _.filter(upsertItems, item => !_.find(currentItems, currentItem => currentItem.id === item.id));

    // https://github.com/kolodny/immutability-helper
    let tranform = _.set({}, path, {
      $push: appendItems
    });

    return update(previousResult, tranform);
  }

  return previousResult;
};

//-------------------------------------------------------------------------------------------------
// Optimistic Updates.
// http://dev.apollodata.com/react/optimistic-ui.html
// http://dev.apollodata.com/react/api-mutations.html#graphql-mutation-options-optimisticResponse
// http://dev.apollodata.com/react/api-mutations.html#graphql-mutation-options-update
//-------------------------------------------------------------------------------------------------

const OptimisticResponse = (item, mutations) => {

  let updatedItem = Transforms.applyObjectMutations(item, mutations);

  // Important for update.
  _.assign(updatedItem, {
    __typename: item.type
  });

  return {
    upsertItems: [updatedItem]
  };
};

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
    options: (props) => {
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

      return {
        variables: {
          filter: ProjectFilter
        }
      };
    },

    props: ({ ownProps, data }) => {
      let { search } = data;

      return {
        project: _.get(search, 'items[0]')
      };
    }
  }),

  // http://dev.apollodata.com/react/queries.html
  graphql(TestQuery, {

    // http://dev.apollodata.com/react/queries.html#graphql-options
    options: (props) => {
      let { options } = props;
      console.log('graphql.options:', TestQueryName);

      return {
        variables: {
          filter
        },

        // http://dev.apollodata.com/react/api-queries.html#graphql-config-options-fetchPolicy
//      fetchPolicy: 'network-only',

        // http://dev.apollodata.com/react/cache-updates.html#resultReducers
        reducer: ListReducer(TestQuery, 'search.items', options.reducer)
      };
    },

    // http://dev.apollodata.com/react/api-queries.html#graphql-query-options
    // http://dev.apollodata.com/react/queries.html#graphql-skip

    // http://dev.apollodata.com/react/queries.html#graphql-props-option
    props: ({ ownProps, data }) => {
      let { errors, loading, search } = data;
      let items = _.get(search, 'items');
      console.log('graphql.props:', TestQueryName, loading ? 'loading...' : TypeUtil.stringify(search));

      // TODO(burdon): updateQuery.
      // Decouple Apollo query/result from component.
      return {
        errors,
        loading,

        items,

        refetch: () => {
          // NOTE: Doesn't trigger re-render (i.e., HOC observer) unless results change.
          data.refetch();
        }
      };
    }
  }),

  // http://dev.apollodata.com/react/mutations.html
  graphql(TestMutation, {

    options: {

      // Custom cache update (for particular query; more flexible to use reducer).
      // http://dev.apollodata.com/core/read-and-write.html#updating-the-cache-after-a-mutation
      // http://dev.apollodata.com/react/api-mutations.html#graphql-mutation-options-update
      // update: (proxy, { data }) => {
      // }
    },

    // http://dev.apollodata.com/react/mutations.html#custom-arguments
    props: ({ ownProps, mutate }) => ({

      // TODO(burdon): update.
      // http://dev.apollodata.com/react/api-mutations.html#graphql-mutation-options-update

      //
      // Insert item.
      //
      updateItem: (item, bucket, mutations) => {
        console.assert(item && bucket && mutations);

        let optimisticResponse =
          ownProps.options.optimisticResponse && OptimisticResponse(item, mutations);

        return mutate({
          variables: {
            mutations: [
              {
                itemId: ID.toGlobalId(item.type, item.id),
                bucket,
                mutations
              }
            ]
          },

          optimisticResponse
        });
      },

      //
      // Insert item.
      //
      insertItem: (type, bucket, mutations) => {
        console.assert(type && bucket && mutations);

        let itemId = idGenerator.createId();

        let optimisticResponse =
          ownProps.options.optimisticResponse && OptimisticResponse({ type, id: itemId }, mutations);

        return mutate({
          variables: {
            mutations: [
              {
                itemId: ID.toGlobalId(type, itemId),
                bucket,
                mutations
              }
            ]
          },

          optimisticResponse
        });
      }
    })
  })

)(ListComponent);

const SimpleListComponentWithApollo = compose(

  // http://dev.apollodata.com/react/queries.html
  graphql(TestQuery, {

    options: (props) => {
      return {
        variables: {
          filter
        },

        reducer: ListReducer(TestQuery, 'search.items')
      };
    },

    props: ({ ownProps, data }) => {
      let { errors, loading, search } = data;
      let items = _.get(search, 'items');

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

    // TODO(burdon): Use actual interface.
    let networkInterface;
    switch (_.get(config, 'query.network')) {
      case 'testing': {
        networkInterface = new TestingNetworkInterface(() => AppState(this._store.getState()));
        break;
      }

      default: {
        networkInterface = createNetworkInterface({
          uri: _.get(config, 'graphql')
        }).use([
          {
            // http://dev.apollodata.com/core/network.html#networkInterfaceMiddleware
            applyMiddleware: ({ options }, next) => {

              // Set the Auth header.
              options.headers = _.assign(options.headers, {
                'Authorization': AuthDefs.JWT_SCHEME + ' ' + _.get(config, 'credentials.id_token')
              });

              next();
            }
          }
        ]);
      }
    }

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
      networkInterface
    });

    //
    // Redux.
    // TODO(burdon): Add Rethunk.
    //

    // Initial options.
    let initialState = {
      options: {
        reducer: true,
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
