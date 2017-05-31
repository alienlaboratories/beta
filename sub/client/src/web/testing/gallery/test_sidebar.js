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
      <div className="ux-column ux-grow">

        <Sidebar ref="sidebar" autoClose={ false }>
          <div className="ux-panel ux-column ux-grow">
            <div className="ux-section ux-padding">
              <div>A</div>
              <div>B</div>
              <div>C</div>
            </div>
          </div>
        </Sidebar>

        <div className="ux-panel ux-column">
          <div className="ux-section ux-padding">
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
