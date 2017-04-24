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
import { Database, IdGenerator, Matcher, SystemStore } from 'alien-core';

import {
  apiRouter,              // TODO(burdon): Rename.

  Firebase,
  FirebaseItemStore
} from 'alien-api';

import {
  getIdToken,
  isAuthenticated,
  oauthRouter,
  loginRouter,             // TODO(burdon): Separate login from user (e.g., profile)

  OAuthProvider,
  OAuthRegistry,
  ServiceRegistry,
  UserManager,

  GoogleOAuthProvider,
  GoogleDriveQueryProcessor,
  GoogleDriveServiceProvider,
  GoogleMailServiceProvider
} from 'alien-services';

import { appRouter } from './router/app';
import { hotRouter } from './router/hot';

import ENV from './env';

const logger = Logger.get('server');

/**
 * Web server.
 */
export class WebServer {

  constructor(config) {
    console.assert(config);

    this._config = config;
    this._app = express();
  }

  get info() {
    return {
      env: ENV,
      config: this._config
    };
  }

  async init() {

    await this.initDatabase();
    await this.initMiddleware();
    await this.initAuth();

    await this.initHandlebars();
    await this.initApp();
    await this.initPages();
    await this.initErrorHandling();

    return this;
  }

  /**
   * Database and query processors.
   */
  initDatabase() {

    // NOTE: The seed provide repeatable IDs in dev but not production.
    this._idGenerator = new IdGenerator(!__PRODUCTION__ && 1234);

    // Query item matcher.
    this._matcher = new Matcher();

    // Firebase
    // https://firebase.google.com/docs/database/admin/start
    this._firebase = new Firebase({
      databaseURL: _.get(this._config, 'firebase.databaseURL'),
      credentialPath: path.join(ENV.APP_SERVER_CONF_DIR, _.get(this._config, 'firebase-admin.credentialPath'))
    });

    //
    // Database.
    //

    this._systemStore = new SystemStore(
      new FirebaseItemStore(new IdGenerator(), this._matcher, this._firebase.db, Database.NAMESPACE.SYSTEM, false));

    // TODO(burdon): ItemStore/QueryProcessor.
    this._database = new Database()
      .registerItemStore(this._systemStore)
      .registerQueryProcessor(this._systemStore);
  }

  /**
   * Authentication and user/client management.
   */
  initAuth() {

    // Default login.
    this._googleAuthProvider = new GoogleOAuthProvider(_.get(this._config, 'google'), ENV.APP_SERVER_URL);

    // OUath providers.
    this._oauthRegistry = new OAuthRegistry()
      .registerProvider(this._googleAuthProvider);

    // User manager.
    this._userManager = new UserManager(this._googleAuthProvider, this._systemStore);

    // TODO(burdon): Factor out path constants (e.g., OAuthProvider.PATH).
    // NOTE: This must be defined ("used') before other services.
    this._app.use(OAuthProvider.PATH, oauthRouter(this._userManager, this._systemStore, this._oauthRegistry, {
      app: this._app  // TODO(burdon): Externalize app.use().
    }));

    // User registration.
    this._app.use('/user', loginRouter(this._userManager, this._oauthRegistry, this._systemStore, {
      home: '/home'
    }));
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
    this._app.use('/app', appRouter(this._config, {
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

    this._app.get('/profile', isAuthenticated('/home'), function(req, res, next) {
      let user = req.user;
      return this._systemStore.getGroups(user.id).then(groups => {
        res.render('profile', {
          user,
          groups,
          idToken: getIdToken(user),
          providers: this._oauthRegistry.providers,
//        crxUrl: _.get(this._config, 'app.crxUrl')       // TODO(burdon): ???
        });
      })
      .catch(next);
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
        logger.info(this.constructor.name + ' = ' + JSON.stringify(this.info, 0, 2));
        logger.info(`http://${addr.address}:${addr.port} [${__ENV__}]`);
        resolve(this);
      });
    });
  }
}
