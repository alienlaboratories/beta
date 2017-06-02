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
    actions: PropTypes.object.isRequired,
  };

  render() {
    let { eventListener, actions, children } = this.props;

    const Action = ({ action }) => {
      function handleAction() {
        console.assert(action.handler);
        action.handler(action);
      }

      return (
        <i className="ux-icon ux-icon-action" title={ action.title }
           onClick={ handleAction }>{ action.icon }</i>
      );
    };

    let id = 0;
    return (
      <div className="ux-status-bar ux-toolbar">
        <div className="ux-icons">
          { _.map(actions.debug, action => <Action key={ ++id } action={ action }/>) }
        </div>

        <div className="ux-grow ux-center">{ children }</div>

        <div className="ux-icons">
          { _.map(actions.runtime, action => <Action key={ ++id } action={ action }/>) }
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
    send: false,
    recv: false
  };

  constructor() {
    super(...arguments);

    this._timer = {
      send: Async.delay(750),
      recv: Async.delay(500)
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
      .listen('network.send', event => { trigger('send'); })
      .listen('network.recv', event => { trigger('recv'); });
  }

  componentWillUnmount() {
    // Cancel timers to avoid setState on unmounted component.
    // JS Error: Warning: setState(...): Can only update a mounted or mounting component.
    // https://facebook.github.io/react/blog/2015/12/16/ismounted-antipattern.html
    this._timer.send();
    this._timer.recv();
  }

  render() {
    let { send, recv } = this.state;

    return (
      <div className="ux-icons">
        <i className={ DomUtil.className('ux-icon', 'ux-icon-network-recv', recv && 'ux-on') }/>
        <i className={ DomUtil.className('ux-icon', 'ux-icon-network-send', send && 'ux-on') }/>
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
    error: null
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
    this.setState({ error: null });
  }

  render() {
    let { error } = this.state;

    return (
      <div className="ux-icons">
        <i className={ DomUtil.className('ux-icon-error', 'ux-icon', error && 'ux-on') }
           title={ ErrorUtil.message(error) || '' }
           onClick={ this.handleReset.bind(this) }/>
      </div>
    );
  }
}
