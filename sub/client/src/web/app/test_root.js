//
// Copyright 2017 Alien Labs.
//

import React from 'react';
import { Redirect, Router, Route } from 'react-router';
import { ApolloProvider } from 'react-apollo';
import PropTypes from 'prop-types';

import { Path } from '../common/path';

import TestingActivity from '../containers/activities/testing';

import '../resources/css/app.less';

/**
 * Minimal base app for testing/development.
 *
 * The Application must be a pure React component since HOCs may cause the component to be re-rendered,
 * which would trigger a Router warning.
 *
 * Activities are top-level components that set-up the context.
 */
export class Application extends React.Component {

  static propTypes = {
    injector: PropTypes.object.isRequired,
    client: PropTypes.object.isRequired,
    store: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired
  };

  render() {
    let { client, store, history } = this.props;

    // https://github.com/ReactTraining/react-router
    // TODO(burdon): onEnter/onLeave.

    return (
      <ApolloProvider client={ client } store={ store }>
        <Router history={ history }>
          {/* v4: <Switch> */}

          <Route exact path={ Path.HOME } component={ TestingActivity }/>
          <Redirect from="*" to={ Path.HOME }/>

          {/* </Switch> */}
        </Router>
      </ApolloProvider>
    );
  }
}

// Default import required for HMR.
module.exports = Application;
