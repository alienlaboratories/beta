//
// Copyright 2017 Alien Labs.
//

import React from 'react';
import ReactDOM from 'react-dom';

import GraphiQLComponent from 'alien-client/graphiql';

console.log('Config = %s', JSON.stringify(window.config));

//
// Get headers from server request.
//
let headers = _.assign({
  'Accept':       'application/json',
  'Content-Type': 'application/json'
}, window.config.headers);

ReactDOM.render(
  <GraphiQLComponent graphql={ window.config.graphql } headers={ headers }/>,
  document.getElementById('root')
);
