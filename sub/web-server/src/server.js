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

import { Const } from './const';
import META from './meta';

const __ENV__ = _.get(process.env, 'NODE_ENV', 'development');

const __PRODUCTION__ = __ENV__ === 'production';

const ENV = {
  PORT: _.get(process.env, 'PORT', 3000),
  HOST: _.get(process.env, 'HOST', __PRODUCTION__ ? '0.0.0.0' : '127.0.0.1'),

  WEB_SERVER_VIEWS_DIR:  _.get(process.env, 'WEB_SERVER_VIEWS_DIR',  path.join(__dirname, './views')),
  WEB_SERVER_PUBLIC_DIR: _.get(process.env, 'WEB_SERVER_PUBLIC_DIR', path.join(__dirname, './public')),
};

const sites = {

  alienlabs: {
    hosts: ['alienlabs.io', 'alienlaboratories.com'],
    home: 'sites/alienlabs',
    defs: {
      css: '/css/alienlabs.css',
      title: 'Alien Labs'
    }
  },

  minderlabs: {
    hosts: ['minderlabs.com'],
    home: 'sites/minderlabs',
    defs: {
      css: '/css/minderlabs.css',
      title: 'Alien Labs'
    }
  },

  robotik: {
    hosts: ['alienlabs.io'],
    home: 'sites/robotik',
    defs: {
      css: '/css/robotik.css',
      title: 'Robotik'
    }
  }
};

const getDomain = (hostname) => {
  let parts = hostname.split('.');
  parts.splice(0, parts.length - 2);
  return parts.join('.');
};

const getSite = (hostname=undefined) => {
  let site = hostname && _.find(sites, site => _.indexOf(site.hosts, getDomain(hostname)) !== -1);
  return _.defaultsDeep(site || sites.robotik, {
    defs: {
      version: META.APP_VERSION
    }
  });
};

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
    await this.initPages();
    await this.initStatus();
    await this.initErrorHandling();

    return this;
  }

  /**
   * Express middleware.
   */
  initMiddleware() {

    // Http redirect.
    // TODO(burdon): Move to ELB?
    this._app.enable('trust proxy');
    this._app.use(ExpressUtil.HttpRedirect);

    // https://expressjs.com/en/starter/static-files.html
    this._app.use(favicon(path.join(ENV.WEB_SERVER_PUBLIC_DIR, 'favicon.ico')));

    this._app.use(express.static(ENV.WEB_SERVER_PUBLIC_DIR));

    this._app.use(bodyParser.urlencoded({ extended: false }));
    this._app.use(bodyParser.json());

    this._app.use(cookieParser());
  }

  /**
   * Handlebars.
   * https://github.com/ericf/express-handlebars
   */
  initHandlebars() {

    this._app.engine('hbs', handlebars({
      extname: '.hbs',
      layoutsDir: path.join(ENV.WEB_SERVER_VIEWS_DIR, '/layouts'),
      partialsDir: path.join(ENV.WEB_SERVER_VIEWS_DIR, '/partials'),
      defaultLayout: 'main',
      helpers: ExpressUtil.Helpers
    }));

    this._app.set('view engine', 'hbs');
    this._app.set('views', ENV.WEB_SERVER_VIEWS_DIR);
  }

  /**
   * Handlebars pages.
   */
  initPages() {

    this._app.get('/', (req, res) => {
      res.redirect('/home');
    });

    this._app.get('/home', (req, res) => {
      let site = getSite(req.hostname);
      res.render(site.home, site.defs);
    });

    this._app.get('/hiring', (req, res) => {
      let site = getSite();
      res.render('hiring', site.defs);
    });
  }

  /**
   * Status.
   */
  initStatus() {

    // Status.
    this._app.get('/status', (req, res, next) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify({
        env: __ENV__,
        version: Const.APP_VERSION
      }, null, 2));
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
  // TODO(burdon): Factor out.
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
          res.redirect('/');
//        res.render('error', { code, err });
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
