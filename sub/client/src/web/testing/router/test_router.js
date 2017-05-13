//
// Copyright 2017 Minder Labs.
//

import React from 'react';
import ReactDOM from 'react-dom';
import { createStore, combineReducers } from 'redux';
import { syncHistoryWithStore, routerReducer } from 'react-router-redux';
import createHashHistory from 'history/createHashHistory';

import { BrowserRouter as Router, Route, Link } from 'react-router-dom';

import './test_router.less';

//
// https://github.com/reactjs/react-router-redux
//

const store = createStore(
  combineReducers({
    routing: routerReducer
  })
);

const history = syncHistoryWithStore(createHashHistory({
  basename: '/router',
  hashType: 'noslash'
}), store);

// TODO(burdon): Redux dispatch to navigate.

const Header = () => (
  <div>
    <Link to="/foo">Foo</Link>
    <Link to="/bar">Bar</Link>
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

const Root = () => (
  <Router history={ history }>
    <div>
      <Header/>
      <Route path="/foo" component={ Foo }/>
      <Route path="/bar" component={ Bar }/>
    </div>
  </Router>
);

ReactDOM.render(Root(), document.getElementById('app-root'));
