//
// Copyright 2017 Alien Labs.
//

import React from 'react';
import PropTypes from 'prop-types';

import './debug.less';

/**
 * Debug panel.
 */
export class DebugPanel extends React.Component {

  // TODO(burdon): Show/hide based on Redux state.

  static contextTypes = {
    config: PropTypes.object.isRequired
  };

  handleOptionChanged(name, event) {
    let { config } = this.context;
    let value = event.target.checked;

    // TODO(burdon): Redux action to recreate network interface.
    if (name === 'networkDelay') {
      value = value ? 5000: 0;       // TODO(burdon): Const.
    }

    _.set(config.options, name, value);
    this.forceUpdate();
  }

  render() {
    let { config } = this.context;

    // TODO(burdon): Should be part of Redux state (to update listeners).
    let { debugInfo, optimisticResponse, invalidations, networkDelay } = _.get(config, 'options', {});

    // console.warn('DEBUG\n' + JSON.stringify(config, null, 2));

    // TODO(burdon): Move reconnect button here. Fire Redux action.
    // TODO(burdon): Batch Queries, Batch Mutations.

    return (
      <div className="ux-debug-panel-container">
        <div className="ux-debug-panel ux-text-noselect">
          <h3>Debug Settings</h3>
          <div>
            <div>
              <label>
                <input type="checkbox"
                       onChange={ this.handleOptionChanged.bind(this, 'debugInfo') }
                       checked={ debugInfo }/> Debug Info</label>
            </div>
            <div>
              <label>
                <input type="checkbox"
                       onChange={ this.handleOptionChanged.bind(this, 'optimisticResponse') }
                       checked={ optimisticResponse }/> Optimistic Responses</label>
            </div>
            <div>
              <label>
                <input type="checkbox"
                       onChange={ this.handleOptionChanged.bind(this, 'invalidations') }
                       checked={ invalidations }/> Invalidations</label>
            </div>
            <div>
              <label>
                <input type="checkbox"
                       onChange={ this.handleOptionChanged.bind(this, 'networkDelay') }
                       checked={ !!networkDelay }/> Network Delay</label>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
