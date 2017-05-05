//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';

import { AuthDefs } from 'alien-core';

import { OAuthProvider } from '../auth/oauth';

/**
 * Service providers retrieve, sync and index external data items.
 */
export class ServiceProvider {

  /**
   * @param {string} id
   */
  constructor(id) {
    console.assert(id);
    this._id = id;
  }

  get id() {
    return this._id;
  }

  get meta() {
    throw new Error('Not implemented');
  }

  get link() {
    throw new Error('Not implemented');
  }
}

/**
 * OAuth Service Provider.
 */
export class OAuthServiceProvider extends ServiceProvider {

  /**
   * @param {OAuthProvider} authProvider
   * @param {string} id
   * @param {[string]} scopes
   */
  constructor(authProvider, id, scopes) {
    super(id);
    console.assert(authProvider && _.isArray(scopes));
    this._authProvider = authProvider;

    // Adds minimal OpenID scopes (ID, email) requird by passport.
    this._scopes = _.concat(AuthDefs.OPENID_LOGIN_SCOPES, scopes);
  }

  get link() {
    return this._authProvider.createAuthUrl(this._scopes);
  }
}

/**
 * Service Registry.
 */
export class ServiceRegistry {

  constructor() {
    this._providers = new Map();
  }

  registerProvider(provider) {
    console.assert(provider);
    this._providers.set(provider.id, provider);
    return this;
  }

  get providers() {
    return Array.from(this._providers.values()).sort((a, b) => a.meta.title.localeCompare(b.meta.title));
  }
}
