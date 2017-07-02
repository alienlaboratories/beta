//
// Copyright 2017 Alien Labs.
//

import React from 'react';
import ReactDOM from 'react-dom';
import { select } from 'd3-selection';

import { D3Canvas } from '../../components/d3/d3_canvas.js';

import './test_d3.less';

/**
 * D3 Utils.
 */
class D3Util {

  /**
   * Points for an n-sided polygon.
   * @param center
   * @param r
   * @param n
   * @param theta
   * @returns {Array}
   */
  static polygon(center, r, n=3, theta=0) {
    console.assert(center && r && n >=3);

    let points = [];

    let delta = 2 * Math.PI / n;
    for (let i = 0; i < n; i++) {
      points.push({ x: center.x + Math.sin(theta) * r, y: center.y + Math.cos(theta) * r });
      theta += delta;
    }

    return points;
  }

  /**
   * @param {[{ x, y }]} p
   * @returns {string} D3 polygon points string.
   */
  static points(points) {
    return _.map(points, p => p.x + ' ' + p.y).join(',');
  }

  /**
   * Return field of polygons.
   * @param center
   */
  static tessellation(center, ) {

  }
}

/**
 * Hex.
 */
class Hex extends React.Component {

  state = {
    theta: 0,
    items: [
      {
        id: 'I-1',
        title: 'Item-1'
      }
    ]
  };

  // TODO(burdon): Factor out animator.
  /*
  interval = null;

  componentDidMount() {
    this.interval = setInterval(() => {
      if (this.state.theta < Math.PI)
      this.setState({
        theta: this.state.theta + Math.PI / 90
      });
    }, 100);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }
  */

  renderD3(root, data) {
    let { theta } = this.state;

    // TODO(burdon): Translate all points (matrix).
    // TODO(burdon): Share/cache points across shapes (rounding errors)?
    // TODO(burdon): Mouseover: select, zoom, rotate.
    // TODO(burdon): Resize rect (auto-update).

    let d = 2;
    let points = [];
    let center = { x: root.clientWidth / 2, y: root.clientHeight / 2 };
    let r = Math.max(center.x, center.y) / 8;
    for (let y = -d; y <= d; y++) {
      let odd = (Math.round(y / 2) * 2 !== y) ? 1 : 0;

      for (let x = -d; x <= d - odd; x++) {
        let dx = odd * r * Math.cos(Math.PI / 6);

        let w = 2 * r * Math.cos(Math.PI / 6);
        let h = 3 * r * Math.sin(Math.PI / 6);

        points.push({
          points: D3Util.polygon({
            x: center.x + x * w + dx,
            y: center.y + y * h
          }, r, 6)
        });
      }
    }

    // TODO(burdon): webpack 2 WDS is automatics?
    // TODO(burdon): Hierarchical rendering shape -> lines.
    // TODO(burdon): Split enter, exit, merge/update.

    let polygons = select(root)
      .selectAll('polygon')
      .data(points);

    polygons
      .enter()
        .append('polygon')
        .attr('class', 'hex')
        .attr('points', d => D3Util.points(d.points));

    polygons
      .exit()
        .remove();

    /*
    let groups = select(root)
      .selectAll('g')
        .data(points)
      .enter()
        .append('g');

    let polygons = groups.selectAll('line')
      .data(d => d)
      .enter()
        .append('line')
        .attr('x1', line => line.x1)
        .attr('y1', line => line.y1)
        .attr('x2', line => line.x2)
        .attr('y2', line => line.y2)
        */
  }

  /*
  render2(root, data) {

    let rectRenderer = (selection) => {
      selection
        .attr('x', 10)
        .attr('y', 10)
        .attr('width', 400)
        .attr('height', 100);
    };

    // TODO(burdon): Merge (see mote).

    // Add elements.
    let a = select(root)
      .selectAll('rect')
      .data(data.items)
      .enter()
      .append('rect');

    // Remove elements.
    let b = select(root)
      .selectAll('rect')
      .data(data.items)
      .exit()
      .remove();

    // Update elements.
    let c = select(root)
      .selectAll('rect')
      .data(data.items)
      .call(rectRenderer);
  }
  */

  render() {
    return (
      <D3Canvas className="ux-grow"
                ref={ c => { this.canvas = c; } }
                data={ this.state }
                renderer={ this.renderD3.bind(this) }/>
    );
  }
}

ReactDOM.render(<Hex/>, document.getElementById('root'));
