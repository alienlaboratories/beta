//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';
import { graphql } from 'graphql';
import { print } from 'graphql/language/printer';
import { createNetworkInterface } from 'apollo-client';

import { Async, Logger, TypeUtil } from 'alien-util';
import { AuthDefs } from 'alien-core';

const logger = Logger.get('testing');

/**
 * Network interface.
 *
 * @param { credentials, graphql } config
 */
export function createNetworkInterfaceWithAuth(config={}) {

  // http://dev.apollodata.com/core/network.html#networkInterfaceMiddleware
  let middleware = [{
    applyMiddleware: ({ options }, next) => {

      // Set the Auth header.
      options.headers = _.assign(options.headers, {
        'Authorization': AuthDefs.JWT_SCHEME + ' ' + _.get(config, 'credentials.id_token')
      });

      next();
    }
  }];

  // http://dev.apollodata.com/core/network.html#createNetworkInterface
  return createNetworkInterface({
    uri: _.get(config, 'graphql', '/graphql')
  }).use(middleware);
}

/**
 * Test Apollo Client NetworkInterface.
 */
export class LocalNetworkInterface {

  /**
   * @param schema GraphQL schema.
   * @param {{ userId, buckets }} context
   * @param {{}|function} options Provide callback for dynamic options.
   *
   * Options {
   *  {number} networkDelay
   * }
   */
  constructor(schema, context, options={}) {
    console.assert(schema && context && options);

    this._schema = schema;
    this._context = context;
    this._options = options;

    this._requestCount = 0;
  }

  get count() {
    return this._requestCount;
  }

  //
  // NetworkInterface
  //
  // WARNING: Errors thrown here are swallowed by Apollo.
  //
  // http://dev.apollodata.com/core/network.html#NetworkInterface
  // https://github.com/apollographql/apollo-client/blob/master/src/transport/networkInterface.ts
  //

  query(request) {
    let { operationName, query, variables } = request;
    if (!operationName) {
      operationName = _.get(query, 'definitions[0].name.value');
    }
    logger.log('Query:', operationName);

    let { networkDelay=0 } = _.isFunction(this._options) ? this._options() : this._options;

    let requestCount = ++this._requestCount;
    logger.info(`REQ[${operationName}:${requestCount}]`, variables && TypeUtil.stringify(variables) || {});

    let root = {};

    return Async.timeout(networkDelay).then(() => {

      // https://github.com/graphql/graphql-js/blob/master/src/graphql.js
      return graphql(this._schema, print(query), root, this._context, variables, operationName).then(result => {
        logger.info(`RES[${operationName}:${requestCount}]`, TypeUtil.stringify(result));
        if (result.errors) {
          logger.error(result.errors[0]);
          throw new Error(result.errors[0]);
        }

        return result;
      });
    });
  }
}
