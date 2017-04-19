//
// Copyright 2017 Minder Labs.
//

import _ from 'lodash';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import debug from 'debug';
import express from 'express';
import favicon from 'serve-favicon';
import handlebars from 'express-handlebars';
import http from 'http';
import path from 'path';
import session from 'express-session';
import uuid from 'node-uuid';

const __ENV__ = _.get(process.env, 'NODE_ENV', 'development');

const __DEVELOPMENT__   = __ENV__ === 'development';
const __PRODUCTION__    = __ENV__ === 'production';

const ENV = {
  PORT: '5000',
  HOST: __PRODUCTION__ ? '0.0.0.0' : '127.0.0.1',
  MINDER_VIEWS_DIR: './src/views'
};

const logger2 = debug('server');

const logger = {
  info: (e) => logger2(e)
};

/**
 *
 */
class WebServer {

  constructor() {
    this._app = express();
  }

  async init() {

    await this.initHandlebars();
    await this.initPages();
    await this.initErrorHandling();

    return this;
  }

  /**
   * Handlebars.
   * https://github.com/ericf/express-handlebars
   */
  initHandlebars() {

    this._app.engine('handlebars', handlebars({
      layoutsDir: path.join(ENV.MINDER_VIEWS_DIR, '/layouts'),
      defaultLayout: 'main'
//    helpers: ExpressUtil.Helpers
    }));

    this._app.set('view engine', 'handlebars');
    this._app.set('views', ENV.MINDER_VIEWS_DIR);
  }


  /**
   * Handlebars pages.
   */
  initPages() {

    this._app.get('/', (req, res) => {
      res.redirect('/home');
    });

    this._app.get('/home', (req, res) => {
      res.render('home');
    });
  }

  /**
   * Error handling middleware (e.g., uncaught exceptions).
   * https://expressjs.com/en/guide/error-handling.html
   * https://strongloop.com/strongblog/async-error-handling-expressjs-es7-promises-generators/
   * https://expressjs.com/en/starter/faq.html
   *
   * NOTE: Must be last.
   * NOTE: Must have all 4 args (error middleware signature).
   * NOTE: Async functions must call next() for subsequent middleware to be called.
   *
   * app.get((req, res, next) => {
   *   return new Promise((resolve, reject) => {
   *     res.end();
   *   }).catch(next);
   * });
   */
  initErrorHandling() {

    // Handle missing resource.
    this._app.use((req, res, next) => {
      // TODO(burdon): core.
//    throw new HttpError(404);
    });

    // Handle errors.
    this._app.use((err, req, res, next) => {
      let json = _.startsWith(req.headers['content-type'], 'application/json');

      let code = err.code || 500;
      if (code >= 500 || __PRODUCTION__) {
        logger.error(`[${req.method} ${req.url}]:`, err);

        if (json) {
          res.status(code).end();
        } else {
          // TODO(burdon): User facing page in prod.
          res.render('error', { code, err });
        }
      } else {
        logger.warn(`[${req.method} ${req.url}]:`, err);

        if (json) {
          res.status(err.code).end();
        } else {
          res.redirect('/');
        }
      }
    });
  }

  /**
   *
   * @return {Promise.<WebServer>}
   */
  start() {
    return new Promise((resolve, reject) => {
      this._server = http.Server(this._app);
      this._server.listen(ENV.PORT, ENV.HOST, () => {
        let addr = this._server.address();
        logger.info(`http://${addr.address}:${addr.port} [${__ENV__}]`);
        resolve(this);
      });
    });
  }
}
