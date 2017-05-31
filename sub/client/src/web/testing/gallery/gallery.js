//
// Copyright 2017 Alien Labs.
//

import React from 'react';
import ReactDOM from 'react-dom';
import { Link, Router, Route, hashHistory } from 'react-router';

import TestBoard from './test_board';
import TestList from './test_list';
import TestSidebar from './test_sidebar';
import TestText from './test_text';

import './gallery.less';

//
// Components.
//
const Components = [
  {
    id: 'text',
    name: 'Text',
    render: () => <TestText/>
  },
  {
    id: 'list',
    name: 'List',
    render: () => <TestList/>
  },
  {
    id: 'board',
    name: 'Board',
    render: () => <TestBoard/>
  },
  {
    id: 'sidebar',
    name: 'Sidebar',
    render: () => <TestSidebar/>
  }
];

/**
 * Gallery.
 */
class Gallery extends React.Component {

  render() {
    let { params={} } = this.props;
    let { component } = params;

    let c = _.find(Components, c => c.id === component) || Components[0];

    return (
      <div className="ux-fullscreen ux-column">
        <header>
          <ul className="ux-inline">
          { _.map(Components, component => (
            <li key={ component.id }>
              <Link to={ '/' + component.id }>{ component.name }</Link>
            </li>
          ))}
          </ul>
        </header>

        <main>
          { c.render() }
        </main>

        <footer>
          <ul className="ux-inline">
            <li>Gallery</li>
          </ul>
        </footer>
      </div>
    );
  }
}

// TODO(burdon): StaticRouter
// https://reacttraining.com/react-router/web/api/StaticRouter

const App = (
  <Router history={ hashHistory }>
    <Route path="/" component={ Gallery }/>
    <Route path="/:component" component={ Gallery }/>
  </Router>
);

ReactDOM.render(App, document.getElementById('app-root'));
