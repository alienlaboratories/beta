//
// Copyright 2017 Alien Labs.
//

import React from 'react';

import { Sidebar, SidebarToggle } from '../../../components/sidebar';

/**
 * Test List.
 */
export class TestSidebar extends React.Component {

  render() {
    return (
      <div className="ux-panel ux-grow ux-row">

        <Sidebar ref="sidebar" autoClose={ false }>
          <div className="ux-column ux-grow">
            <div className="ux-padding">
              <div>A</div>
              <div>B</div>
              <div>C</div>
            </div>
          </div>
        </Sidebar>

        <div className="ux-panel ux-column ux-grow">

          <div>
            <div className="ux-tool-bar">
              <h1>Sidebar</h1>
              <SidebarToggle sidebar={ () => this.refs.sidebar }/>
            </div>
          </div>

          <div className="ux-grow">
            <span>Content</span>
          </div>

        </div>

      </div>
    );
  }
}
