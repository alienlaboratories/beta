//`
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';
import express from 'express';

import { Const } from 'alien-core';
import { AppDefs } from 'alien-client';
import { getUserSession, isAuthenticated } from 'alien-services';

import META from '../meta';

/**
 * Sets-up serving the app (and related assets).
 *
 * @param {{ firebase }} config
 * @param {ClientManager} clientManager
 * @param {{ assets, bundle, appConfig }} options
 * @return {Router}
 */
export const appRouter = (config, clientManager, options) => {
  console.assert(config && clientManager && options);
  console.assert(options.assets);

  const router = express.Router();

  //
  // Webpack assets (either from dist or HMR).
  //
  router.use('/assets', express.static(options.assets));

  //
  // Manifest for web worker (e.g., push permissions).
  // <link rel="manifest" href="/app/manifest.json">
  // NOTE: Also server /firebase-messaging-sw.js
  //
  router.get('/manifest.json', (req, res) => {

    // TODO(burdon): Move to Firebase const.
    // Browser sender ID (common among all FCM JS clients -- i.e., not project specific).
    // https://firebase.google.com/docs/cloud-messaging/js/client#configure_the_browser_to_receive_messages
    const GCM_SENDER_ID = '103953800507';

    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({
      gcm_sender_id: GCM_SENDER_ID
    }));
  });

  //
  // Service worker config.
  //
  router.get('/service_worker_config.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({
      messagingSenderId: _.get(config, 'firebase.app.messagingSenderId')
    }));
  });

  //
  // Web app.
  //
  router.get(new RegExp(/(.*)/), isAuthenticated('/user/login'), (req, res, next) => {
    let { user } = req;
    let { bundle='web', platform='web' } = req.query;

    // Create the client.
    // TODO(burdon): Mobile web?
    // TODO(burdon): Client should register after startup? (might store ID -- esp. if has worker, etc.)
    clientManager.create(user.id, Const.PLATFORM.WEB).then(client => {
      console.assert(client);

      //
      // Client app config.
      // NOTE: This is the canonical shape of the config object.
      // The CRX has to construct this by registering the user (post auth) and client.
      //
      let appConfig = _.defaults({

        env: __ENV__,

        query: req.query,

        app: {
          version: META.APP_VERSION
        },

        // DOM root element.
        root: AppDefs.DOM_ROOT,

        // Apollo.
        graphql: AppDefs.GRAPHQL_PATH,
        graphiql: AppDefs.GRAPHIQL_PATH,

        // Client registration.
        client: _.pick(client, ['id', 'messageToken']),

        // Credentials.
        credentials: _.pick(getUserSession(user), ['id_token', 'id_token_exp']),

        // Canonical profile.
        userProfile: _.pick(user, ['id', 'email', 'displayName', 'photoUrl']),

        // Firebase config.
        // TODO(burdon): Remove unnecessary keys?
        firebase: _.get(config, 'firebase.app'),

        loggly: _.get(config, 'alien.loggly')

      }, options.appConfig);

      //
      // Render the app page.
      //
      res.render('app', {

        // Handlebars layout.
        layout: 'app',

        // Const.PLATFORM.
        platform,

        // Loading animation.
        loadingIndicator: __PRODUCTION__,

        // Client bundle.
        // TODO(burdon): Hot mode.
        bundle: options.bundle || bundle,

        // Client JSON config.
        config: appConfig
      });
    }).catch(next);
  });

  return router;
};
