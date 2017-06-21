//
// Copyright 2017 Alien Labs.
//

import React from 'react';
import PropTypes from 'prop-types';

import { ReactUtil } from '../util/react';

import { TextBox } from './textbox';

import './labels.less';

/**
 * Label picker.
 */
export class LabelPicker extends React.Component {

  static propTypes = {
    onUpdate:   PropTypes.func.isRequired,                          // function({string} label, {bool} add=true)
    labels:     PropTypes.arrayOf(PropTypes.string).isRequired,
  };

  handleLabelAdd(label) {
    this.props.onUpdate(label, true);
  }

  handleLabelRemove(label) {
    this.props.onUpdate(label, false);
  }

  render() {
    return ReactUtil.render(this, () => {
      let { labels } = this.props;

      return (
        <div className="ux-label-picker">
          <div>
            { _.map(labels, label =>
            <div key={ label } className="ux-label">
              <span>{ label }</span>
              <i className="ux-icon ux-icon-clear" onClick={ this.handleLabelRemove.bind(this, label) }/>
            </div>
            ) }
          </div>

          <TextBox placeholder="Add label" onEnter={ this.handleLabelAdd.bind(this) }/>
        </div>
      );
    });
  }
}
