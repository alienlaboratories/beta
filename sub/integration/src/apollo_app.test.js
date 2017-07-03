//
// Copyright 2017 Alien Labs.
//

import React from 'react';
import ReactDOM from 'react-dom';

/**
 * Test app.
 */
class TestApp extends React.Component {

  render() {
    console.error('!!!!!!!!!!!');
    return (
      <div>Test</div>
    );
  }
}

test('Test', async () => {

  ReactDOM.render(<TestApp/>, document.createElement('div'));
});
