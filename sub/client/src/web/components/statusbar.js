//
// Copyright 2017 Alien Labs.
//

import React from 'react';
import PropTypes from 'prop-types';

import { Async, DomUtil, ErrorUtil } from 'alien-util';

import './statusbar.less';

/**
 * Status bar.
 */
export class StatusBar extends React.Component {

  static propTypes = {
    onAction: PropTypes.func.isRequired
  };

  constructor() {
    super(...arguments);

    this._timer = {
      networkIn: Async.delay(750),
      networkOut: Async.delay(500)
    };

    this.state = {
      error: false,
      networkIn: false,
      networkOut: false
    };
  }

  componentWillUnmount() {
    // TODO(burdon): Statusbar should be part of outer component (so isn't rerenderes on nav).
    // Cancel timers to avoid setState on unmounted component.
    // JS Error: Warning: setState(...): Can only update a mounted or mounting component.
    // https://facebook.github.io/react/blog/2015/12/16/ismounted-antipattern.html
    this._timer.networkIn();
    this._timer.networkOut();
  }

  error(error) {
    this.setState({
      error
    });
  }

  // TODO(burdon): Factor out listener.
  networkIn() { this.network('networkIn'); }
  networkOut() { this.network('networkOut'); }
  network(type) {
    this.setState({
      [type]: true
    });

    this._timer[[type]](() => {
      this.setState({
        [type]: false
      });
    });
  }

  handleAction(icon) {
    this.props.onAction(icon);
  }

  handleClickError() {
    this.error(false);
  }

  render() {
    let { children } = this.props;
    let { error, networkIn, networkOut } = this.state;

    // TODO(burdon): Break into sections (assemble left/right).
    // TODO(burdon): Network indicators as separate control.
    // TODO(burdon): Generalize actions (incl. link action).
    // TODO(burdon): Get icons/links from props.

    const Action = ({ action }) => {
      return (
        <i className="ux-icon ux-icon-action" title={ action.title }
           onClick={ this.handleAction.bind(this, action) }>{ action.icon }</i>
      );
    };

    const leftActions = [
      {
        type: 'bug',
        title: 'Debug info.',
        icon: 'bug_report'
      },
      {
        type: 'link',
        title: 'GraphiQL.',
        icon: 'language',
        href: '/graphiql'
      },
      {
        type: 'link',
        title: 'Admin console.',
        icon: 'graphic_eq',
        href: '/admin'
      },
      {
        type: 'link',
        title: 'Account settings.',
        icon: 'settings',
        href: '/profile'
      }
    ];

    const rightActions = [
      {
        type: 'refresh',
        title: 'Refresh queries.',
        icon: 'refresh'
      }
    ];

    let id = 0;

    return (
      <div className="ux-status-bar ux-tool-bar">
        <div className="ux-icons">
          { _.map(leftActions, action => <Action key={ ++id } action={ action }/>) }
        </div>

        <div className="ux-grow ux-center">{ children }</div>

        <div className="ux-icons">
          { _.map(rightActions, action => <Action key={ ++id } action={ action }/>) }
        </div>

        <div className="ux-icons">
          <i className={ DomUtil.className('ux-icon', 'ux-icon-network-in', networkIn && 'ux-on') }/>
          <i className={ DomUtil.className('ux-icon', 'ux-icon-network-out', networkOut && 'ux-on') }/>
        </div>

        <div className="ux-icons">
          <i className={ DomUtil.className('ux-icon-error', 'ux-icon', error && 'ux-on') }
             title={ ErrorUtil.message(error.message) }
             onClick={ this.handleClickError.bind(this, 'error') }/>
        </div>
      </div>
    );
  }
}
