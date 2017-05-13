//
// Copyright 2017 Alien Labs.
//

import React from 'react';

import { Sidebar, SidebarToggle } from '../../components/sidebar';

/**
 * Test List.
 */
export default class TestSidebar extends React.Component {

  render() {
    return (
      <div className="ux-column">

        <Sidebar ref="sidebar" autoClose={ false }>
          <div>
            <div>A</div>
            <div>B</div>
            <div>C</div>
          </div>
        </Sidebar>

        <div className="test-panel">
          <div className="ux-bar">
            <h1>Content</h1>
            <SidebarToggle sidebar={ () => this.refs.sidebar }/>
          </div>
        </div>

      </div>
    );
  }
}
