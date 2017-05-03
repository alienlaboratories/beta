//
// Copyright 2017 Alien Labs.
//

import { Logger } from 'alien-util';

const logger = Logger.get('sub');

/**
 * Manage queries.
 */
export class QueryRegistry {

  // HOC.
  static subscribe() {}

  static createId() {
    return _.uniqueId('S-');
  }

  // TODO(burdon): Factor out (move to alien-core).
  // http://dev.apollodata.com/core/apollo-client-api.html#QuerySubscription

  constructor(config) {
    console.assert(config);
    this._config = config;
    this._components = new Map();
  }

  /**
   * Register query subscription.
   * @param id
   * @param refetch
   */
  register(id, refetch) {
    console.assert(id);
    console.assert(refetch, 'Component must have refetch prop.');
    this._components.set(id, { refetch });
    logger.log(`Registered[${this._components.size}]: ${id}`);
  }

  /**
   * Unregister query.
   * @param id
   */
  unregister(id) {
    console.assert(id);
    this._components.delete(id);
    logger.log(`Unregistered[${this._components.size}]: ${id}`);
  }

  /**
   * Manually refetch registered queries.
   */
  invalidate() {
    logger.log(`Refetching queries: ${this._components.size}`);
    this._components.forEach(registration => {
      registration.refetch();
    });
  }
}
