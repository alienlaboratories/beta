//
// Copyright 2017 Alien Labs.
//

import { Analytics } from './analytics';

// TODO(burdon): Split reducers (e.g., factor out search, registration/server, widget state).

//-------------------------------------------------------------------------------------------------
// Global.
// The global reducer listens for Apollo query results and updates the App state.
//-------------------------------------------------------------------------------------------------

export const GlobalAppReducer = (state, action) => {
  switch (action.type) {

    //
    // Listen for Apollo query results (and cached results).
    //
    case 'APOLLO_QUERY_RESULT':
    case 'APOLLO_QUERY_RESULT_CLIENT': {
      let { queryId } = action;

      // Find the query matching Navbar updates.
      let query = state.apollo.queries[queryId];
      console.assert(query, 'Invalid query: ' + queryId);
      return state;
    }

    default:
      return state;
  }
};

//-------------------------------------------------------------------------------------------------
// App.
//-------------------------------------------------------------------------------------------------

const APP_NAMESPACE = 'ALIEN_APP';

/**
 * Main App actions.
 */
export class AppAction {

  static ACTION = {
    DEBUG:          `${APP_NAMESPACE}/DEBUG`,
    REGISTER:       `${APP_NAMESPACE}/REGISTER`,
    SEARCH:         `${APP_NAMESPACE}/SEARCH`,
    CANVAS_STATE:   `${APP_NAMESPACE}/CANVAS_STATE`
  };

  static get namespace() {
    return APP_NAMESPACE;
  }

  static getState(state, field=undefined) {
    state = _.get(state, AppAction.namespace, {});
    return field ? _.get(state, field) : state;
  }

  //
  // Action creators.
  // Use thunk to handle async requests.
  // http://redux.js.org/docs/advanced/AsyncActions.html
  // http://stackoverflow.com/questions/35411423/how-to-dispatch-a-redux-action-with-a-timeout/35415559#35415559
  //

  static toggleDebugInfo() {
    return {
      type: AppAction.ACTION.DEBUG,
      showInfo: -1                      // true | false | -1 (toggle)
    };
  }

  static toggleDebugPanel() {
    return {
      type: AppAction.ACTION.DEBUG,
      showPanel: -1                     // true | false | -1 (toggle)
    };
  }

  /**
   * Register client (after server connect).
   */
  static register(userProfile, server=undefined) {
    console.assert(userProfile);
    return {
      type: AppAction.ACTION.REGISTER,
      value: {
        userProfile,
        server
      }
    };
  }

  /**
   * Set search state (preserved across navigation).
   * @param {{ text }} filter GQL filter.
   */
  static search(filter) {
    console.assert(_.isObject(filter));
    return {
      type: AppAction.ACTION.SEARCH,
      value: filter
    };
  }

  /**
   * Set canvas state (e.g., current view).
   */
  static setCanvasState(state) {
    return {
      type: AppAction.ACTION.CANVAS_STATE,
      value: state
    };
  }
}

/**
 * @param injector
 * @param config
 * @param apolloClient
 * @constructor
 */
export const AppReducer = (injector, config, apolloClient) => {
  console.assert(injector && config && apolloClient);

  const initialState = {

    // NOTE: Needed since can't be passed via React context to HOC containers.
    injector: injector,

    // Client config.
    config: config,

    // Apollo client (for accessing the cache).
    // https://github.com/apollographql/core-docs/blob/master/source/read-and-write.md
    client: apolloClient,

    // Debugging options.
    debug: {
      showInfo: config.debug,
      showPanel: config.debug
    },

    // Search bar.
    search: {
      filter: { text: '' }
    },

    // Board type.
    canvas: {
      boardAlias: undefined
    }
  };

  // NOTE: Don't modify state directly.
  // https://github.com/reactjs/redux/blob/master/docs/Troubleshooting.md
  return (state=initialState, action) => {
//  console.log('ACTION[%s]: %s', action.type, JSON.stringify(state));
    switch (action.type) {

      case AppAction.ACTION.DEBUG: {
        let { debug } = state;
        let { showInfo, showPanel } = action;

        if (showInfo === -1) { showInfo = !debug.showInfo; }
        if (showPanel === -1) { showPanel = !debug.showPanel; }

        return _.assign({}, state, { debug: { showInfo, showPanel } });
      }

      case AppAction.ACTION.REGISTER: {
        return _.assign({}, state, _.pick(action.value, ['userProfile', 'server']));
      }

      case AppAction.ACTION.SEARCH: {
        // TODO(madadam): Sanitize logs for privacy; Remove user query from analytics events.
        let analytics = state.injector.get(Analytics.INJECTOR_KEY);
        analytics.track('search', { filter: action.value });

        return _.assign({}, state, {
          search: { filter: action.value }
        });
      }

      case AppAction.ACTION.CANVAS_STATE: {
        return _.assign({}, state, {
          canvas: action.value
        });
      }

      default:
        return state;
    }
  };
};
