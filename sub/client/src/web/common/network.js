//
// Copyright 2017 Alien Labs.
//

import { print } from 'graphql/language/printer';
import { createNetworkInterface } from 'apollo-client';

import { HttpUtil, TypeUtil, Logger } from 'alien-util';
import { AuthUtil, Const } from 'alien-core';

import { ConnectionManager } from './client';

const logger = Logger.get('net');

/**
 * Wrapper for the Apollo network interface.
 */
export class NetworkManager {

  /**
   * Manages teh Apollo network interface.
   *
   * @param {object }config
   * @param {AuthManager} authManager
   * @param {ConnectionManager} connectionManager
   * @param {EventListener} eventListener
   */
  constructor(config, authManager, connectionManager, eventListener) {
    console.assert(config && authManager && connectionManager && eventListener);
    this._config = config;
    this._authManager = authManager;
    this._connectionManager = connectionManager;
    this._eventListener = eventListener;

    // Log and match request/reponses.
    this._requestCount = 0;
    this._requestMap = new Map();

    // Set on initialization.
    this._logger = null;
    this._networkInterface = null;

    this._debug = this._config.debug;
  }

  /**
   * Initializes the network manager.
   * May be called multiple times -- e.g., after config has changed.
   * @returns {NetworkManager}
   */
  init() {

    // Reset stats.
    this._requestCount = 0;
    this._requestMap.clear();

    // Logging.
    this._logger = new NetworkLogger(this._config);

    /**
     * Add headers for request context (e.g., (JWT) id_token Authentication header).
     */
    const addHeaders = {
      applyMiddleware: ({ request, options }, next) => {

        // Auth.
        options.headers = AuthUtil.setAuthHeader(options.headers, this._authManager.idToken);

        // Client.
        options.headers = ConnectionManager.setClientHeader(options.headers, this._connectionManager.clientId);

        next();
      }
    };

    /**
     * TODO(burdon): Paging bug when non-null text filter.
     * https://github.com/apollostack/apollo-client/issues/897
     * https://github.com/apollographql/apollo-client/pull/906
     * https://github.com/apollographql/apollo-client/pull/913
     * "There can only be one fragment named ItemFragment" (from server).
     */
    const fixFetchMoreBug = {
      applyMiddleware: ({ request, options }, next) => {

        // Map of definitions by name.
        let definitions = {};

        // Remove duplicate fragment.
        request.query.definitions = _.filter(request.query.definitions, definition => {
          let name = definition.name.value;
          if (definitions[name]) {
            logger.warn('SKIPPING: %s', name);
            return false;
          } else {
            definitions[name] = true;
            return true;
          }
        });

        next();
      }
    };

    /**
     * Debugging network delay.
     */
    const delayRequest = () => ({
      applyMiddleware: ({ request, options }, next) => {
        let delay = _.get(this._config, 'options.networkDelay');
        if (delay) {
          setTimeout(() => {
            next();
          }, delay);
        } else {
          next();
        }
      }
    });

    /**
     * Intercept request.
     * http://dev.apollodata.com/core/network.html#networkInterfaceMiddleware
     */
    const logRequest = {
      applyMiddleware: ({ request, options }, next) => {

        // Track request ID.
        // https://github.com/apollostack/apollo-client/issues/657
        const requestId = `${request.operationName}-${++this._requestCount}`;
        this._requestMap.set(requestId, request);

        // Add header to track response.
        options.headers = _.assign(options.headers, {
          [Const.HEADER.REQUEST_ID]: requestId
        });

        this._logger.logRequest(requestId, request, options.headers);
        this._eventListener.emit({ type: 'network.send' });
        next();
      }
    };

    /**
     * Intercept response.
     * http://dev.apollodata.com/core/network.html#networkInterfaceAfterware
     * https://github.com/apollostack/apollo-client/issues/657
     */
    const logResponse = {
      applyAfterware: ({ response, options }, next) => {

        // Clone the result to access body.
        // https://github.com/apollostack/core-docs/issues/224
        // https://developer.mozilla.org/en-US/docs/Web/API/Response/clone
        let clonedResponse = response.clone();

        // Match request.
        const requestId = options.headers[Const.HEADER.REQUEST_ID];
        let removed = this._requestMap.delete(requestId);
        console.assert(removed, 'Request not found: %s', requestId);

        // Error handler.
        const onError = errors => {
          this._logger.logErrors(requestId, errors);
          this._eventListener.emit({
            type: 'error',
            error: {
              message: NetworkLogger.stringify(errors)
            }
          });
        };

        if (clonedResponse.ok) {
          clonedResponse.json().then(payload => {
            if (payload.errors) {
              onError(payload.errors);
            } else {
              this._logger.logResponse(requestId, payload);
              this._eventListener.emit({ type: 'network.recv' });
            }
          });
        } else {
          // GraphQL Network Error (i.e., non-200 response).
          clonedResponse.json().then(payload => {
            onError(payload.errors);
          }).catch(() => {
            // Serious server error returns non JSON response.
            clonedResponse.text().then(text => {
              onError([{
                message: text
              }]);
            });
          });
        }

        next();
      }
    };

    //
    // Create the interface (and middleware).
    // http://dev.apollodata.com/core/network.html
    // http://dev.apollodata.com/core/apollo-client-api.html#createNetworkInterface
    // http://dev.apollodata.com/core/network.html#networkInterfaceMiddleware
    // https://github.com/apollographql/apollo-client/blob/master/src/transport/networkInterface.ts
    //

    let middleware = [
      addHeaders,
      fixFetchMoreBug,      // TODO(burdon): Remove.
      logRequest
    ];

    let afterware = [
      logResponse
    ];

    // Debugging delay.
    if (this._debug) {
      middleware.push(delayRequest());
    }

    // TODO(burdon): Batching (change middleware).
    // http://dev.apollodata.com/core/network.html#query-batching

    // http://dev.apollodata.com/core/network.html#network-interfaces
    let options = {
      uri: this._config.graphql,
      batchInterval: 10
    };

    // Create HTTPFetchNetworkInterface
    let networkInterface = createNetworkInterface(options)
      .use(middleware)
      .useAfter(afterware);

    // Error handling.
    this._networkInterface = {
      query: request => networkInterface.query(request)
        .catch(error => {
          this._eventListener.emit({
            type: 'error',
            error
          });

          throw error;
        })
    };

    return this;
  }

  /**
   * Exposes the interface for the Apollo client.
   * @returns {*}
   */
  get networkInterface() {
    return this._networkInterface;
  }
}

/**
 * Client request logger.
 * http://dev.apollodata.com/core/network.html#networkInterfaceMiddleware
 */
class NetworkLogger {

  /**
   * Server can return array of errors.
   * See graphqlRouter's formatError option.
   *
   * @param errors
   * @return {string}
   */
  static stringify(errors) {
    return errors.map(error => error.message).join(' | ');
  }

  /**
   * @param {Wrapper} options
   */
  constructor(options) {
    console.assert(options);
    this._options = options;
  }

  logRequest(requestId, request, headers) {
    logger.log(`[_TS_] ===>>> [${requestId}] ${TypeUtil.stringify(request.variables || {})}`);

    //
    // Show GraphiQL link.
    //
    if (_.get(this._options, 'debug', true)) {
      let url = HttpUtil.absoluteUrl(_.get(this._options, 'graphiql', '/graphiql'));
      logger.info('[' + TypeUtil.pad(requestId, 24) + ']: ' + url + '?' + HttpUtil.toUrlArgs({
        clientId:   headers[Const.HEADER.CLIENT_ID],
        query:      print(request.query),
        variables:  JSON.stringify(request.variables)
      }));
    }
  }

  logResponse(requestId, response) {
    logger.log(`[_TS_] <<<=== [${requestId}] ${TypeUtil.stringify(response.data)}`);
  }

  logErrors(requestId, errors) {
    logger.error(`GraphQL Error [${requestId}]: ${NetworkLogger.stringify(errors)}`);
  }
}

/**
 * Implements the Apollo NetworkInterface to proxy requests to the background page.
 *
 * http://dev.apollodata.com/core/network.html#custom-network-interface
 */
export class ChromeNetworkInterface { // extends NetworkInterface {

  static CHANNEL = 'apollo';

  /**
   * Creates the network interface with the given Chrome channel (to the BG page).
   *
   * @param channel
   * @param eventListener
   */
  constructor(channel, eventListener=undefined) {
    console.assert(channel);
    this._channel = channel;
    this._eventListener = eventListener;
  }

  /**
   * Proxy request through the message sender.
   *
   * @param {GraphQLRequest} gqlRequest
   * @return {Promise<GraphQLResult>}
   */
  query(gqlRequest) {
    this._eventListener && this._eventListener.emit({ type: 'network.send' });
    // TODO(burdon): Catch errors.
    return this._channel.postMessage(gqlRequest, true).then(gqlResponse => {
      this._eventListener && this._eventListener.emit({ type: 'network.recv' });
      return gqlResponse;
    });
  }
}
