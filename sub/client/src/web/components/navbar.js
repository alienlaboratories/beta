//
// Copyright 2017 Alien Labs.
//

import React from 'react';
import PropTypes from 'prop-types';

/**
 * App navigation
 */
export class NavBar extends React.Component {

  static propTypes = {
    navigator: PropTypes.object,
  };

  render() {
    let { navigator, children } = this.props;

    return (
      <nav className="ux-navbar ux-toolbar">
        { children }

        { navigator &&
        <NavButtons navigator={ navigator }/>
        }
      </nav>
    );
  }
}

/**
 * Navigation controls.
 */
export class NavButtons extends React.Component {

  static propTypes = {
    navigator: PropTypes.object.isRequired,
  };

  handleBack() {
    this.props.navigator.goBack();
  }

  handleForward() {
    this.props.navigator.goForward();
  }

  render() {
    return (
      <div className="ux-nav-buttons">
        <i className="ux-icon ux-icon-back" onClick={ this.handleBack.bind(this) }/>
        <i className="ux-icon ux-icon-forward" onClick={ this.handleForward.bind(this) }/>
      </div>
    );
  }
}
