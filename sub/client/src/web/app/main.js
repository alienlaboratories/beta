//
// Copyright 2017 Alien Labs.
//

import React from 'react';
import { browserHistory } from 'react-router';

import { Injector } from 'alien-util';

import { AuthManager } from '../common/auth';
import { BaseApp } from '../common/base_app';
import { ConnectionManager } from '../common/client';
import { FirebaseCloudMessenger } from '../common/cloud_messenger';
import { NetworkManager } from '../common/network';
import { AppAction, AppReducer, GlobalAppReducer } from '../common/reducers';

import { TypeRegistryFactory } from '../containers/type_factory';

/**
 * Base class for Web apps.
 */
export class WebApp extends BaseApp {

  /**
   * Apollo network.
   */
  initNetwork() {

    // Manages OAuth.
    this._authManager = new AuthManager(this._config);

    // FCM Push Messenger.
    this._cloudMessenger = new FirebaseCloudMessenger(this._config, this._eventHandler).listen(message => {
      if (_.get(this._config, 'options.invalidate')) {
        this._queryRegistry.invalidate();
      }
    });

    // Manages the client connection and registration.
    this._connectionManager = new ConnectionManager(this._config, this._authManager, this._cloudMessenger);

    // TODO(burdon): Local transient item store.
    /*
    let idGenerator = this._injector.get(IdGenerator);
    let matcher = this._injector.get(Matcher);
    this._itemStore = new MemoryItemStore(idGenerator, matcher, Database.NAMESPACE.LOCAL, false);
    */
    this._itemStore = null;

    // Apollo network requests.
    this._networkManager =
      new NetworkManager(this._config, this._authManager, this._connectionManager, this._eventHandler)
        .init(this._itemStore);
  }

  postInit() {

    // Register client.
    return this._authManager.authenticate().then(userProfile => {
      let { id, email, displayName:name, photoUrl:avatar } = userProfile;

      // Map to Segment well-known fields (https://segment.com/docs/spec/identify/#traits).
      this._analytics.identify(id, _.omitBy({ email, name, avatar }, _.isNil));

      // TODO(burdon): Retry?
      return this._connectionManager.register().then(client => {
        this.store.dispatch(AppAction.register(userProfile));
      });
    });
  }

  terminate() {
    // Unregister client.
    this._connectionManager && this._connectionManager.unregister();
  }

  get itemStore() {
    return this._itemStore;
  }

  get providers() {
    return [
      Injector.provide(TypeRegistryFactory())
    ];
  }

  get globalReducer() {
    return GlobalAppReducer;
  }

  get reducers() {
    return {
      // Main app reducer.
      // TODO(burdon): Push to BaseApp.
      [AppAction.namespace]: AppReducer(this.injector, this.config, this.client)
    }
  }

  get networkInterface() {
    return this._networkManager.networkInterface;
  }

  get history() {
    // https://github.com/ReactTraining/react-router/blob/master/docs/guides/Histories.md#browserhistory
    return browserHistory;
  }
}
