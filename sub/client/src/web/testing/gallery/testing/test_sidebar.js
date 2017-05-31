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
      <div className="ux-panel ux-grow">

        <Sidebar ref="sidebar" autoClose={ false }>
          <div className="ux-column ux-grow">
            <div className="ux-padding">
              <div>A</div>
              <div>B</div>
              <div>C</div>
            </div>
          </div>
        </Sidebar>

        <div className="ux-panel">
          <div className="ux-padding">
            <div className="ux-row ux-grow">
              <div className="ux-grow">
                <h1>Content</h1>
              </div>

              <SidebarToggle sidebar={ () => this.refs.sidebar }/>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
