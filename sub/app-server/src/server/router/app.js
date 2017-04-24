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
 * @param {{ assets, bundle, config }} options
 * @return {Router}
 */
export const appRouter = (options) => {
  const router = express.Router();

  console.assert(options.assets);
  console.assert(options.bundle);

  //
  // Webpack assets.
  //
  router.use('/assets', express.static(options.assets));

  //
  // Config.
  //
  let config = _.defaults({

    root: Const.DOM_ROOT,

  }, _.get(options, 'config'));

  //
  // App loader.
  //
  router.get('/', (req, res) => {
    res.render('app', {
      loadingIndicator: __PRODUCTION__,
      bundle: options.bundle,
      config
    });
  });

  return router;
};
