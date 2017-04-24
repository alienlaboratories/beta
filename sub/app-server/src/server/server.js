//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import express from 'express';
import favicon from 'serve-favicon';
import handlebars from 'express-handlebars';
import http from 'http';
import path from 'path';

import { ExpressUtil, HttpError, Logger } from 'alien-util';

import { appRouter } from './router/app';
import { hotRouter } from './router/hot';

import ENV from './env';

const logger = Logger.get('server');

logger.info('ENV = ' + JSON.stringify(ENV, null, 2));

/**
 * Web server.
 */
export class WebServer {

  constructor() {
    this._app = express();
  }

  async init() {

    await this.initMiddleware();
    await this.initHandlebars();
    await this.initApp();
    await this.initPages();
    await this.initErrorHandling();

    return this;
  }

  /**
   * Express middleware.
   */
  initMiddleware() {

    // https://expressjs.com/en/starter/static-files.html
    this._app.use(favicon(path.join(ENV.APP_SERVER_PUBLIC_DIR, 'favicon.ico')));

    this._app.use(express.static(ENV.APP_SERVER_PUBLIC_DIR));

    this._app.use(bodyParser.urlencoded({ extended: false }));
    this._app.use(bodyParser.json());

    this._app.use(cookieParser());
  }

  /**
   * Handlebars.
   * https://github.com/ericf/express-handlebars
   */
  initHandlebars() {

    this._app.engine('handlebars', handlebars({
      layoutsDir: path.join(ENV.APP_SERVER_VIEWS_DIR, '/layouts'),
      defaultLayout: 'main',
      helpers: ExpressUtil.Helpers
    }));

    this._app.set('view engine', 'handlebars');
    this._app.set('views', ENV.APP_SERVER_VIEWS_DIR);
  }

  /**
   * Client application.
   */
  initApp() {

    //
    // Hot loader.
    // NOTE: Must come above other asset handlers.
    //

    if (__HOT__) {
      this._app.use(hotRouter({
        webpackConfig: require('../../webpack-web.config')
      }));
    }

    //
    // Web app.
    //
    this._app.use('/app', appRouter({
      assets: ENV.APP_SERVER_ASSETS_DIR,
      bundle: 'test'
    }));
  }

  /**
   * Handlebars pages.
   */
  initPages() {

    this._app.get('/', (req, res) => {
      res.redirect('/home');
    });

    this._app.get('/home', (req, res) => {
      res.render('home', {});
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
      throw new HttpError(404);
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
