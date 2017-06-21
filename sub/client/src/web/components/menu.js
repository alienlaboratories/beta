//
// Copyright 2017 Alien Labs.
//

import React from 'react';
import PropTypes from 'prop-types';

import { DomUtil } from 'alien-util';

import { ReactUtil } from '../util/react';

import './menu.less';

/**
 * Menu button.
 */
export class MenuBar extends React.Component {

  static propTypes = {
    panel:          PropTypes.object.isRequired,
    onSelect:       PropTypes.func.isRequired,
    className:      PropTypes.string
  };

  static childContextTypes = {
    onMenuSelect:   PropTypes.func
  };

  state = {
    open: false
  };

  getChildContext() {
    return {
      onMenuSelect: this.handleSelect.bind(this)
    };
  }

  handleToggle(event) {
    let { open } = this.state;

    // Don't steal focus.
    event.preventDefault();

    this.setState({
      open: !open
    }, () => {
      !open && this.refs.hidden.focus();
    });
  }

  handleSelect(value) {
    let { onSelect } = this.props;
    onSelect(value);
  }

  handleBlur() {
    this.setState({
      open: false
    });
  }

  render() {
    return ReactUtil.render(this, () => {
      let { className, panel, children } = this.props;
      let { open } = this.state;

      return (
        <div className="ux-menu-container">
          <div className={ DomUtil.className('ux-menu-bar', className) }>
            { children }

            <i className="ux-icon ux-icon-menu" onMouseDown={ this.handleToggle.bind(this) }/>
          </div>

          { open &&
          <div className="ux-menu-popup">
            <div>
              <input ref="hidden" onBlur={ this.handleBlur.bind(this) }/>
            </div>

            { panel }
          </div>
          }
        </div>
      );
    });
  }
}

/**
 * Popup.
 */
export class MenuPanel extends React.Component {

  render() {
    let { children } = this.props;

    return (
      <div>{ children }</div>
    );
  }
}

/**
 * Menu item.
 */
export class MenuItem extends React.Component {

  static propTypes = {
    value: PropTypes.string.isRequired
  };

  static contextTypes = MenuBar.childContextTypes;

  handleSelect() {
    let { value } = this.props;
    let { onMenuSelect } = this.context;
    onMenuSelect(value);
  }

  render() {
    let { children } = this.props;

    // NOTE: onMouseDown happens before onBlur.
    return (
      <div className="ux-menu-item" onMouseDown={ this.handleSelect.bind(this) }>{ children }</div>
    );
  }
}
