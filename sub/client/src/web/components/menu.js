//
// Copyright 2017 Alien Labs.
//

import React from 'react';

import { ReactUtil } from '../util/react';

/**
 * Menu button.
 */
export class Menu extends React.Component {

  handleOpen() {

  }

  render() {
    return ReactUtil.render(() => {
      return (
        <i className="ux-icon ux-icon-menu" onClick={ this.handleOpen.bind(this) }/>
      );
    });
  }
}

/**
 *
 */
export class MenuPanel extends React.Component {

  render() {
    return ReactUtil.render(() => {
      return (
        <div>Menu</div>
      );
    });
  }
}
