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
    eventListener: PropTypes.object.isRequired,
    actions: PropTypes.array.isRequired,
    onAction: PropTypes.func.isRequired
  };

  handleAction(icon) {
    this.props.onAction(icon);
  }

  render() {
    let { eventListener, actions, children } = this.props;

    const Action = ({ action }) => {
      return (
        <i className="ux-icon ux-icon-action" title={ action.title }
           onClick={ this.handleAction.bind(this, action) }>{ action.icon }</i>
      );
    };

    let id = 0;
    return (
      <div className="ux-status-bar ux-tool-bar">
        <div className="ux-icons">
          { _.map(actions.left, action => <Action key={ ++id } action={ action }/>) }
        </div>

        <div className="ux-grow ux-center">{ children }</div>

        <div className="ux-icons">
          { _.map(actions.right, action => <Action key={ ++id } action={ action }/>) }
        </div>

        <NetworkIndicator eventListener={ eventListener }/>

        <ErrorIndicator eventListener={ eventListener }/>
      </div>
    );
  }
}

/**
 * Network indicator.
 */
class NetworkIndicator extends React.Component {

  static propTypes = {
    eventListener: PropTypes.object.isRequired
  };

  state = {
    in: false,
    out: false
  };

  constructor() {
    super(...arguments);

    this._timer = {
      in: Async.delay(750),
      out: Async.delay(500)
    };

    const trigger = (type) => {
      this.setState({
        [type]: true
      });

      this._timer[[type]](() => {
        this.setState({
          [type]: false
        });
      });
    };

    this.props.eventListener
      .listen('network.in',   event => { trigger('in'); })
      .listen('network.out',  event => { trigger('out'); });
  }

  componentWillUnmount() {
    // Cancel timers to avoid setState on unmounted component.
    // JS Error: Warning: setState(...): Can only update a mounted or mounting component.
    // https://facebook.github.io/react/blog/2015/12/16/ismounted-antipattern.html
    this._timer.networkIn();
    this._timer.networkOut();
  }

  render() {
    let { networkIn, networkOut } = this.state;

    return (
      <div className="ux-icons">
        <i className={ DomUtil.className('ux-icon', 'ux-icon-network-in', networkIn && 'ux-on') }/>
        <i className={ DomUtil.className('ux-icon', 'ux-icon-network-out', networkOut && 'ux-on') }/>
      </div>
    );
  }
}

/**
 * Cancellable error indicator.
 */
class ErrorIndicator extends React.Component {

  static propTypes = {
    eventListener: PropTypes.object.isRequired
  };

  state = {
    error: {}
  };

  constructor() {
    super(...arguments);

    this.props.eventListener.listen('error', event => {
      this.setState({
        error: event.error
      });
    });
  }

  handleReset() {
    this.setState({ error: {} });
  }

  render() {
    let { error } = this.state;

    return (
      <div className="ux-icons">
        <i className={ DomUtil.className('ux-icon-error', 'ux-icon', error && 'ux-on') }
           title={ ErrorUtil.message(error.message) || '' }
           onClick={ this.handleReset.bind(this) }/>
      </div>
    );
  }
}
