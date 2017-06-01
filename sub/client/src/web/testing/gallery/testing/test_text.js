//
// Copyright 2017 Alien Labs.
//

import React from 'react';

import { TextBox } from '../../../components/textbox';

/**
 * Test List.
 */
export class TestText extends React.Component {

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
        <div className="ux-tool-bar ux-padding">
          <div className="ux-grow">
            <TextBox className="ux-grow" autoFocus={ true } value={ text } onCancel={ () => true }/>
          </div>

          <div>
            <button onClick={ this.handleRefresh.bind(this) }>Refresh</button>
            <button onClick={ this.handleChange.bind(this) }>Change</button>
          </div>
        </div>
      </div>
    );
  }
}
