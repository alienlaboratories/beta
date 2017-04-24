//
// Copyright 2017 Alien Labs.
//

import express from 'express';
import moment from 'moment';

/**
 * Webpack Hot Module Replacement (HMR)
 * NOTE: This replaces the stand-alone webpack-dev-server
 *
 * http://madole.github.io/blog/2015/08/26/setting-up-webpack-dev-middleware-in-your-express-application
 * http://webpack.github.io/docs/hot-module-replacement-with-webpack.html
 * https://github.com/gaearon/react-hot-loader/tree/master/docs#starter-kits
 * https://github.com/gaearon/react-hot-boilerplate/issues/102 [Resolved]
 *
 * NOTE: Hot mode cannot work with nodemon (must manually reload).
 * NOTE: CSS changes will not rebuild (since in separate bundle).
 *
 * @param {{ webpackConfig }} options
 * @return {Router}
 */
// TODO(burdon): Move to util (shared with web-server).
export const hotRouter = (options) => {
  const router = express.Router();

  const webpack = require('webpack');
  const webpackDevMiddleware = require('webpack-dev-middleware');
  const webpackHotMiddleware = require('webpack-hot-middleware');

  // https://github.com/webpack/webpack-dev-middleware
  const compiler = webpack(options.webpackConfig);
  router.use(webpackDevMiddleware(compiler, {
    publicPath: options.webpackConfig.output.publicPath,
    noInfo: true,
    stats: { colors: true }
  }));

  // https://github.com/glenjamin/webpack-hot-middleware
  router.use(webpackHotMiddleware(compiler, {
    log: (msg) => console.log('### [%s] %s ###', moment().format('YYYY-MM-DD HH:mm Z'), msg)
  }));

  return router;
};
