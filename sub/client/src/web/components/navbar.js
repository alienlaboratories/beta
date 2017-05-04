//
// Copyright 2017 Alien Labs.
//

import React from 'react';
import PropTypes from 'prop-types';

/**
 * App navigation
 */
export class Navbar extends React.Component {

  // TODO(burdon): Show/hide search view? Search "folder" overlay? (in full screen mode).
  // TODO(burdon): Show hide < > arrows (on mobile).
  // TODO(burdon): Current heading/breadcrumbs (in redux store).

  static contextTypes = {
    typeRegistry: PropTypes.object.isRequired,
  };

  render() {
    let { children } = this.props;

    return (
      <nav className="ux-navbar">
        <div className="ux-expand">
          { children }
        </div>

        <NavButtons/>
      </nav>
    );
  }
}

export class NavButtons extends React.Component {

  static contextTypes = {
    navigator: PropTypes.object.isRequired,
  };

  handleBack() {
    this.context.navigator.goBack();
  }

  handleForward() {
    this.context.navigator.goForward();
  }

  render() {
    return (
      <div className="ux-navbar-buttons">
        <i className="ux-icon ux-icon-action" onClick={ this.handleBack.bind(this) }>arrow_back</i>
        <i className="ux-icon ux-icon-action" onClick={ this.handleForward.bind(this) }>arrow_forward</i>
      </div>
    );
  }
}
