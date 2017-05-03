//
// Copyright 2017 Alien Labs.
//

import React from 'react';
import GraphiQL from 'graphiql';

import { HttpUtil } from 'alien-util';

import './graphiql.less';

//
// Decode URL.
//

let parameters = HttpUtil.parseUrlParams(window.location.search);

//
// Encode URL.
//

function updateURL(update) {
  history.replaceState(null, null, '?' + HttpUtil.toUrlArgs(_.assign(parameters, update)));
}

//
// See node_modules/graphiql/README
// https://raw.githubusercontent.com/graphql/graphiql/master/example/index.html
//

/**
 * GraphiQL Component.
 */
export default class GraphiQLComponent extends React.Component {

  static defaultProps = {

    // API path.
    graphql: '/graphql',

    // Default query.
    query: 'query { viewer { user { id } } }'
  };

  render() {
    let { headers, graphql, query } = this.props;

    return React.createElement(GraphiQL, {

      //
      // Custom fetcher.
      // https://github.com/graphql/graphiql#getting-started
      //
      fetcher: graphQLParams => {
        return fetch(graphql, {
          method: 'post',
          headers: headers,
          credentials: 'include',
          body: JSON.stringify(graphQLParams)
        }).then(function(response) {
          return response.text();
        }).then(function(responseBody) {
          try {
            return JSON.parse(responseBody);
          } catch(error) {
            return responseBody;
          }
        });
      },

      query: parameters.query || query,
      variables: parameters.variables ? JSON.stringify(JSON.parse(parameters.variables), null, 2) : '',
      operationName: parameters.operationName,

      onEditQuery: query => updateURL({ query }),
      onEditVariables: variables => updateURL({ variables }),
      onEditOperationName: operationName => updateURL({ operationName })
    });
  }
}
