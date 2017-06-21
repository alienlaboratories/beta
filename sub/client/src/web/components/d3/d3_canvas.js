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

  // TODO(burdon): Pattern? Resize. Card section.
  // TODO(burdon): Graph (mini-brain in sidebar)
  // TODO(burdon): See framework/sub/frontend/src/main/web/sandbox/mote
  // https://medium.com/@Elijah_Meeks/interactive-applications-with-react-d3-f76f7b3ebc71

  static propTypes = {
    items:      PropTypes.array,
    className:  PropTypes.string
  };

  componentDidMount() {
    this.update();
  }

  componentDidUpdate() {
    this.update();
  }

  update() {
    let { items } = this.props;

    // TODO(burdon): Don't generalize rendering. Instead provide static mixin utils.

    // Add elements.
    select(this.node)
      .selectAll('rect')
      .data(items)
      .enter()
      .append('rect');

    // Remove elements.
    select(this.node)
      .selectAll('rect')
      .data(items)
      .exit()
      .remove();

    // Set properties.
    select(this.node)
      .selectAll('rect')
      .data(items)
      .attr('x', 10)
      .attr('y', 10)
      .attr('width', 40)
      .attr('height', 10);
  }

  render() {
    let { className } = this.props;

    return (
      <svg ref={ node => this.node = node } className={ DomUtil.className('ux-d3-canvas', className) }/>
    );
  }
}
