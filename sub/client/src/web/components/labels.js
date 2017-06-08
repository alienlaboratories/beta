//
// Copyright 2017 Alien Labs.
//

import React from 'react';
import PropTypes from 'prop-types';

import { ReactUtil } from '../util/react';

import './labels';

/**
 * Label picker.
 */
export class LabelPicker extends React.Component {

  static propTypes = {
    onUpdate:   PropTypes.func.isRequired,                          // function({string} label, {bool} add=true)
    labels:     PropTypes.arrayOf(PropTypes.string).isRequired,
  };

  render() {
    return ReactUtil.render(this, () => {
      let { labels } = this.props;

      // https://github.com/olahol/react-tagsinput#how-do-i-add-auto-suggestion
      // https://github.com/prakhar1989/react-tags (DND dep)

      return (
        <div className="ux-label-picker">
          { _.map(labels, label => <span>{ label }</span>) }
        </div>
      );
    });
  }
}
