//
// Copyright 2017 Alien Labs.
//

import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route } from 'react-router-dom';

import TestBoard from './test_board';
import TestList from './test_list';
import TestSidebar from './test_sidebar';
import TestText from './test_text';

import './gallery.less';

//
// Open file relative to webpack-dev-server --content-base
// http://localhost:8080/components/testing/index.html
//

// TODO(burdon): For offline testing, load material-icons locally.

class Gallery extends React.Component {

  static Components = [
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

  state = {
    component: Gallery.Components[0]
  };

  handleSelectChanged(event) {
    this.setState({
      component: _.find(Gallery.Components, component => component.id === event.target.value)
    });
  }

  render() {
    let { component } = this.state;

    return (
      <div className="test-panel">
        <div className="test-header">
          <select value={ component.id } onChange={ this.handleSelectChanged.bind(this) }>
          { _.map(Gallery.Components, component => (
            <option key={ component.id } value={ component.id }>{ component.name }</option>
          ))}
          </select>
        </div>

        <div className="test-container">
          { component.render() }
        </div>
      </div>
    );
  }
}

// TODO(burdon): StaticRouter
// https://reacttraining.com/react-router/web/api/StaticRouter

const App = (
  <Router>
    <Route path="/gallery" component={ Gallery }/>
  </Router>
);

ReactDOM.render(App, document.getElementById('app-root'));
