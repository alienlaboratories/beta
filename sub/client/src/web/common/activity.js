//
// Copyright 2017 Alien Labs.
//

import gql from 'graphql-tag';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { compose, graphql } from 'react-apollo';

import { EventListener, PropertyProvider } from 'alien-util';
import { Const, IdGenerator, Mutator, QueryRegistry } from 'alien-core';
import { Fragments } from 'alien-api';

import { Analytics } from './analytics';
import { ContextManager } from './context';
import { Navigator, WindowNavigator } from './path';
import { AppAction } from './reducers';
import { TypeRegistry } from './type_registry';

//-------------------------------------------------------------------------------------------------
// Default Redux property providers for activities.
// Each Activity has custom props.params provided by the redux-router.
// https://github.com/reactjs/react-redux/blob/master/docs/api.md
//-------------------------------------------------------------------------------------------------

/**
 * Extract state for downstream HOC wrappers.
 */
const mapStateToProps = (state, ownProps) => {
  let appState = AppAction.getState(state);
  let { config, client, injector } = appState;

  // TODO(burdon): Move to Redux state?

  let analytics       = injector.get(Analytics.INJECTOR_KEY);
  let typeRegistry    = injector.get(TypeRegistry);
  let queryRegistry   = injector.get(QueryRegistry);
  let eventListener    = injector.get(EventListener);
  let contextManager  = injector.get(ContextManager);
  let idGenerator     = injector.get(IdGenerator);

  // CRX Navigator opens in new window (overridden in mapDispatchToProps for web).
  let navigator;
  if (_.get(config, 'app.platform') === Const.PLATFORM.CRX) {
    navigator = new WindowNavigator(new PropertyProvider(appState, 'server'));
  }

  return {
    config,
    analytics,
    typeRegistry,
    queryRegistry,
    eventListener,
    contextManager,
    navigator,

    // Needed by Mutator.
    client,
    idGenerator
  };
};

/**
 * Global dispatchers.
 */
const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    navigator: new Navigator(dispatch)
  };
};

/**
 * NOTE: mapDispatchToProps can't access state, so we merge here.
 * https://github.com/reactjs/react-redux/issues/237
 */
const mergeProps = (stateProps, dispatchProps, ownProps) => {
  return _.defaults({}, ownProps, stateProps, dispatchProps);
};

//-------------------------------------------------------------------------------------------------
// HOC.
//-------------------------------------------------------------------------------------------------

export const ViewerQuery = gql`
  query ViewerQuery {

    viewer {
      user {
        ...ItemFragment
      }

      groups {
        ...ItemFragment

        projects {
          ...ItemFragment
        }
      }
    }
  }

  ${Fragments.ItemFragment}
`;

/**
 * Activity helper.
 * Activities are top-level components that set-up the context.
 * Rather than using inheritance this helper provides injectable Redux functions.
 */
export class Activity {

  /**
   * Connect properties for activities.
   */
  static compose() {
    let connectors = [

      // Redux state.
      connect(mapStateToProps, mapDispatchToProps, mergeProps),

      // Apollo mutation.
      // Provides mutator property.
      Mutator.graphql(),

      // Apollo viewer query.
      graphql(ViewerQuery, {
        props: ({ ownProps, data }) => {
          return _.pick(data, ['errors', 'loading', 'viewer']);
        }
      })
    ];

    if (arguments) {
      connectors = _.concat(connectors, arguments);
    }

    return compose(...connectors);
  }

  static childContextTypes = {
    config:           PropTypes.object,
    analytics:        PropTypes.object,
    typeRegistry:     PropTypes.object,
    queryRegistry:    PropTypes.object,
    eventListener:    PropTypes.object,
    contextManager:   PropTypes.object,
    navigator:        PropTypes.object,

    mutator:          PropTypes.object,
    viewer:           PropTypes.object
  };

  static getChildContext(props) {
    let {
      config,
      analytics,
      typeRegistry,
      queryRegistry,
      eventListener,
      contextManager,
      navigator,

      mutator,
      viewer
    } = props;

    console.assert(config);
    console.assert(analytics);
    console.assert(typeRegistry);
    console.assert(queryRegistry);
    console.assert(eventListener);
    console.assert(contextManager);
    console.assert(navigator);
    console.assert(mutator);

    return {
      config,
      analytics,
      typeRegistry,
      queryRegistry,
      eventListener,
      contextManager,
      navigator,

      mutator,
      viewer
    };
  }
}
