//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';

import { AuthDefs } from 'alien-core';

/**
 * Service providers retrieve, sync and index external data items.
 */
export class ServiceProvider {

  // TODO(burdon): Map to syncer. Event subscriptions called from worker? Dependencies. Map of TaskHandlers?
  // TODO(burdon): ServiceRegistry. Syncer is a capability of a service?

  /**
   * @param {string} id
   * @param {OAuthHandler} oauthHandler
   * @param {[string]} scopes
   */
  constructor(id, oauthHandler=null, scopes=null) {
    console.assert(id);
    this._id = id;

    this._oauthHandler = oauthHandler;

    // Adds minimal OpenID scopes (ID, email) requird by passport.
    this._scopes = scopes && _.concat(AuthDefs.OPENID_LOGIN_SCOPES, scopes);
  }

  get id() {
    return this._id;
  }

  get meta() {
    throw new Error('Not implemented');
  }

  get oauthProfiderId() {
    return this._oauthHandler && this._oauthHandler.providerId;
  }

  // TODO(burdon): Rename authLink.
  // TODO(burdon): Post auth trigger (e.g., register subscription).
  // TODO(burdon): Service providers may require auth from multiple OAuth providers.
  get link() {
    return this._oauthHandler && this._oauthHandler.createAuthUrl(this._scopes);
  }

  get scopes() {
    return this._scopes;
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
