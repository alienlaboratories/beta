//
// Copyright 2017 Minder Labs.
//

import React from 'react';
import ReactDOM from 'react-dom';
import { createStore, combineReducers } from 'redux';
import { Provider, connect } from 'react-redux';
import { Route, Link } from 'react-router-dom';
import { ConnectedRouter, push, routerReducer } from 'react-router-redux';
import createHashHistory from 'history/createHashHistory';

import './test_router.less';

//
// TODO(burdon): Not working with v5.
// https://github.com/ReactTraining/react-router/issues/5113 [burdon]
//
// NOTE: react-router-dom v4 requires react-router-redux v5
// https://github.com/reactjs/react-router-redux
// https://github.com/ReactTraining/react-router/tree/master/packages/react-router-redux
//

// Migration (v3=>v4)
// (react-router => react-router-dom)
// let { params } = props.match
// <Switch> (matches first)
// Redirect

//--------------------------------------------------------------------------------------------------
// Components
//--------------------------------------------------------------------------------------------------

const Header = (props) => (
  <div>
    <Link to="/foo">Foo</Link>
    <Link to="/bar">Bar</Link>

    <a onClick={ props.nav.bind(null, '/foo') }>Foo</a>
    <a onClick={ props.nav.bind(null, '/bar') }>Bar</a>
  </div>
);

const Foo = () => (
  <div>
    <h1>Foo</h1>
  </div>
);

const Bar = () => (
  <div>
    <h1>Bar</h1>
  </div>
);

const HeaderWithRedux = connect(
  (state, ownProps) => ({
    // No-op.
  }),
  (dispatch, ownProps) => ({
    nav: (path) => {
      dispatch(push(path));
    }
  })
)(Header);

//--------------------------------------------------------------------------------------------------
// Root
//--------------------------------------------------------------------------------------------------

const reducers = [
  (state={}, action) => {
    switch (action.type) {
      default:
        return state;
    }
  }
];

const store = createStore(
  combineReducers({
    ...reducers,
    routing: routerReducer
  })
);

// NOTE: Warning if click twice.
// https://github.com/ReactTraining/react-router/issues/4467
const history = createHashHistory();

const Root = () => (
  <Provider store={ store }>
    <ConnectedRouter history={ history }>
      <div>
        <HeaderWithRedux/>

        <Route path="/foo" component={ Foo }/>
        <Route path="/bar" component={ Bar }/>
      </div>
    </ConnectedRouter>
  </Provider>
);

ReactDOM.render(Root(), document.getElementById('app-root'));
