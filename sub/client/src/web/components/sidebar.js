//
// Copyright 2017 Alien Labs.
//

import React from 'react';
import PropTypes from 'prop-types';

import { DomUtil } from 'alien-util';

import './sidebar.less';

/**
 * Side panel.
 */
export class Sidebar extends React.Component {

  // TODO(burdon): Nav by keys.
  // http://codepen.io/chriscoyier/pen/umEgv

  static propTypes = {
    autoClose: PropTypes.bool
  };

  static defaultProps = {
    autoClose: true
  };

  constructor() {
    super(...arguments);

    this.state = {
      open: false
    };
  }

  open() {
    this.setState({
      open: true
    }, () => {
      this.refs.hidden.focus();
    });
  }

  close() {
    // NOTE: Race condition with <Link> so use manual onMouseDown to trigger navigation events.
    // http://stackoverflow.com/questions/10652852/jquery-fire-click-before-blur-event
    // NOTE: If timer is used, get error below:
    // Warning: setState(...): Can only update a mounted or mounting component. This usually means you called setState()
    this.setState({
      open: false
    });
  }

  toggle(event) {
    // NOTE: Toggle button should preventDefault to not steal focus.
    this.state.open ? this.close() : this.open();
  }

  handleBlur() {
    if (this.props.autoClose) {
      this.close();
    }
  }

  render() {
    let { children } = this.props;
    let { open } = this.state;

    return (
      <div className="ux-sidebar">
        <div className={ DomUtil.className('ux-sidebar-drawer', open && 'ux-open') }>
          <div>
            <input ref="hidden" onBlur={ this.handleBlur.bind(this) }/>
          </div>

          { children }
        </div>
      </div>
    );
  }
}

/**
 * Toggle button.
 */
export class SidebarToggle extends React.Component {

  static propTypes = {
    sidebar: PropTypes.func.isRequired
  };

  handleToggleSidebar(event) {
    // Don't steal focus (which would cause the sidebar to close).
    event.preventDefault();

    this.props.sidebar().toggle();
  }

  render() {
    return (
      <i className="ux-icon ux-icon-sidebar-toggle"
         onMouseDown={ this.handleToggleSidebar.bind(this) }>menu</i>
    );
  }
}
