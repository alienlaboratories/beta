//
// Copyright 2017 Alien Labs.
//

import React from 'react';
import PropTypes from 'prop-types';

import { DomUtil } from 'alien-util';

/**
 * Canvas container.
 */
export class Canvas extends React.Component {

  static propTypes = {
    className: PropTypes.string
  };

  render() {
    let { className, children } = this.props;

    return (
      <div className={ DomUtil.className('ux-canvas', 'ux-grow', className) }>{ children }</div>
    );
  }
}
