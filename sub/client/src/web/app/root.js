//
// Copyright 2017 Alien Labs.
//

import React from 'react';
import { IndexRedirect, Redirect, Route, Router } from 'react-router';
import { ApolloProvider } from 'react-apollo';
import PropTypes from 'prop-types';

import { Path } from '../common/path';

// import AdminActivity from './activity/admin';
// import CanvasActivity from './activity/canvas';
// import FinderActivity from './activity/finder';
// import TestingActivity from './activity/testing';

/**
 * The Application must be a pure React component since HOCs may cause the component to be re-rendered,
 * which would trigger a Router warning.
 *
 * Activities are top-level components that set-up the context.
 */
class Application extends React.Component {

  static propTypes = {
    injector: PropTypes.object.isRequired,
    client: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired,
    store: PropTypes.object.isRequired
  };

  render() {
    let { client, store, history } = this.props;

    // https://github.com/ReactTraining/react-router
    // TODO(burdon): onEnter/onLeave.

    const Test = () => {
      return (
        <div>Test</div>
      );
    };

    return (
      <ApolloProvider client={ client } store={ store }>

        <Router history={ history }>

          <Route path={ Path.ROOT }>
            <IndexRedirect to={ Path.HOME }/>

            {/*
            <Route path={ Path.ADMIN } component={ AdminActivity }/>
            <Route path={ Path.TESTING } component={ TestingActivity }/>
            */}

            <Route path={ Path.HOME } component={ Test }/>

            {/*
              * /inbox
              * /favorites
              */}
            {/*
            <Route path={ Path.route(['folder']) } component={ FinderActivity }/>
            */}

            {/*
              * /project/xxx
              * /project/board/xxx
              */}
            {/*
            <Route path={ Path.route(['type', 'itemId']) } component={ CanvasActivity }/>
            <Route path={ Path.route(['type', 'canvas', 'itemId']) } component={ CanvasActivity }/>
            */}

            <Redirect from='*' to={ Path.HOME }/>
          </Route>

        </Router>

      </ApolloProvider>
    );
  }
}

module.exports = Application;
