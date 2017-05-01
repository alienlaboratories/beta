//
// Copyright 2017 Alien Labs.
//

import React from 'react';

/**
 * Minimal app for testing.
 */
export default class TestApp extends React.Component {

  render() {
    return (
      <div>TestApp</div>
    );
  }
}

// Enables require('sanity') for HMR; otherwise require('sanity').default
module.exports = TestApp;
