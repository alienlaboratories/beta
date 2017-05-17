//
// Copyright 2017 Alien Labs.
//

import React from 'react';
import { Route, Router, Redirect } from 'react-router';
import { ApolloProvider } from 'react-apollo';
import PropTypes from 'prop-types';

import { Path } from '../../web/common/path';

import FinderActivity from '../../web/containers/activities/finder';

import '../../web/resources/css/core.less';

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
    history: PropTypes.object.isRequired,
  };

  render() {
    let { client, store, history } = this.props;

    return (
      <ApolloProvider client={ client } store={ store }>
        <Router history={ history }>

          <Route path={ Path.route(['folder']) } component={ FinderActivity }/>
          <Redirect from='*' to={ Path.HOME }/>

        </Router>
      </ApolloProvider>
    );
  }
}

// Default import required for HMR.
module.exports = Application;
