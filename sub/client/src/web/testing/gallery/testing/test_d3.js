//
// Copyright 2017 Alien Labs.
//

import React from 'react';

import { D3Canvas } from '../../../components/d3/d3_canvas';

/**
 * Test D3.
 */
export class TestD3 extends React.Component {

  state = {
    items: [
      {
        id: 'I-1',
        title: 'Item-1'
      }
    ]
  };

  render() {
    let { items } = this.state;

    return (
      <div className="ux-panel ux-column ux-grow">
        <D3Canvas className="ux-grow" items={ items }/>
      </div>
    );
  }
}
