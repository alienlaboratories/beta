//
// Copyright 2017 Alien Labs.
//

import React from 'react';

import { TextBox } from '../../components/textbox';

/**
 * Test List.
 */
export default class TestText extends React.Component {

  static WORDS = [
    'Apple',
    'Banana',
    'Cherry'
  ];

  state = {
    idx: 0
  };

  handleRefresh() {
    setTimeout(() => {
      this.forceUpdate();
    }, 1000);
  }

  handleChange() {
    setTimeout(() => {
      this.setState({
        idx: this.state.idx === TestText.WORDS.length - 1 ? 0 : this.state.idx + 1
      });
    }, 1000);
  }

  render() {
    let text = TestText.WORDS[this.state.idx];

    // When should the textbox be updated? Textbox itself can't know.
    //

    return (
      <div className="ux-panel">
        <div className="ux-section ux-padding">
          <TextBox autoFocus={ true } value={ text } onCancel={ () => true }/>

          <button onClick={ this.handleRefresh.bind(this) }>Refresh</button>
          <button onClick={ this.handleChange.bind(this) }>Change</button>
        </div>
      </div>
    );
  }
}
