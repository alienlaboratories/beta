//
// Copyright 2017 Alien Labs.
//

import React from 'react';
import ReactDOM from 'react-dom';
import { applyMiddleware, compose, combineReducers, createStore } from 'redux';
import { Provider, connect } from 'react-redux';
import { hashHistory, Redirect, Route, Router, Link } from 'react-router';
import { push, routerMiddleware, routerReducer, syncHistoryWithStore } from 'react-router-redux';

import './test_router.less';

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
    <HeaderWithRedux/>
    <h1>Foo</h1>
  </div>
);

const Bar = () => (
  <div>
    <HeaderWithRedux/>
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

// https://github.com/reactjs/react-router-redux

const history = hashHistory;

const store = createStore(
  combineReducers({
    ...reducers,
    routing: routerReducer
  }),
  compose(
    applyMiddleware(routerMiddleware(history)),
  )
);

const routerHistory = syncHistoryWithStore(history, store);

const Root = () => (
  <Provider store={ store }>
    <Router history={ routerHistory }>
      <div>
        <Route path="/foo" component={ Foo }/>
        <Route path="/bar" component={ Bar }/>

        <Redirect from="*" to="/foo"/>
      </div>
    </Router>
  </Provider>
);

ReactDOM.render(Root(), document.getElementById('app-root'));
