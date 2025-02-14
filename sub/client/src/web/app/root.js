//
// Copyright 2017 Alien Labs.
//

import React from 'react';
import { Redirect, Router, Route } from 'react-router';
import { ApolloProvider } from 'react-apollo';
import PropTypes from 'prop-types';

import { Path } from '../common/path';

import AdminActivity from '../containers/activities/admin';
import DetailActivity from '../containers/activities/detail';
import FolderActivity from '../containers/activities/folder';
import HomeActivity from '../containers/activities/home';
import TestingActivity from '../containers/activities/testing';

import '../resources/css/app.less';

/**
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

    return (
      <ApolloProvider client={ client } store={ store }>
        <Router history={ history }>
          {/* v4: <Switch> */}

          {/*
            * Must come first.
            */}
          <Route exact path={ Path.ADMIN } component={ AdminActivity }/>
          <Route exact path={ Path.TESTING } component={ TestingActivity }/>

          {/*
            * Home.
            */}
          <Route exact path={ Path.ROOT } component={ HomeActivity }/>

          {/*
            * /inbox
            * /favorites
            */}
          <Route path={ Path.route(['folder']) } component={ FolderActivity }/>

          {/*
            * /project/xxx
            * /project/board/xxx
           */}
          <Route path={ Path.route(['canvas', 'key']) } component={ DetailActivity }/>

          {/*
            * Catch.
            */}
          <Redirect from="*" to={ Path.ROOT }/>

          {/* </Switch> */}
        </Router>
      </ApolloProvider>
    );
  }
}

// Default import required for HMR.
module.exports = Application;
