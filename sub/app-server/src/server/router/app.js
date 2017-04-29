//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';
import express from 'express';

import { Logger } from 'alien-util';

import { Const } from '../../common/const';

const logger = Logger.get('app');

/**
 * Sets-up serving the app (and related assets).
 *
 * @param {{ firebase }} config
 * @param {{ assets, bundle, config }} options
 * @return {Router}
 */
export const appRouter = (config, options) => {
  console.assert(config && options);
  console.assert(options.assets);

  const router = express.Router();

  //
  // Webpack assets (either from dist or HMR).
  //
  router.use('/assets', express.static(options.assets));

  //
  // Manifest for web worker (e.g., push permissions).
  // <link rel="manifest" href="/app/manifest.json">
  //
  router.get('/manifest.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({
      gcm_sender_id: _.get(config, 'firebase.messagingSenderId')
    }));
  });

  //
  // App loader.
  //
  router.get('/', (req, res) => {
    let { bundle='web' } = req.query;

    res.render('app', {

      // Loading animation.
      loadingIndicator: __PRODUCTION__,

      // Client bundle.
      bundle: options.bundle || bundle,

      // Client config.
      config: _.defaults({

        root: Const.DOM_ROOT,

      }, _.get(options, 'config'))
    });
  });

  return router;
};
