//
// Copyright 2017 Alien Labs.
//

import React from 'react';
import PropTypes from 'prop-types';
import { select } from 'd3-selection';

import { DomUtil } from 'alien-util';

import './d3.less';

/**
 * Base class for D3 components.
 */
export class D3Canvas extends React.Component {

  // TODO(burdon): Graph (mini-brain in sidebar)
  // TODO(burdon): See framework/sub/frontend/src/main/web/sandbox/mote
  // https://medium.com/@Elijah_Meeks/interactive-applications-with-react-d3-f76f7b3ebc71

  static propTypes = {
    data:       PropTypes.object,
    renderer:   PropTypes.func,
    className:  PropTypes.string
  };

  componentDidMount() {
    this.update();
  }

  componentDidUpdate() {
    this.update();
  }

  componentWillReceiveProps(nextProps) {
    this.forceUpdate();
  }

  update() {
    let { data, renderer } = this.props;
    renderer && renderer(this.node, data);
  }

  render() {
    let { className } = this.props;

    return (
      <svg ref={ node => this.node = node } className={ DomUtil.className('ux-d3-canvas', className) }/>
    );
  }
}
