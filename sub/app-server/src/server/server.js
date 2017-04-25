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
import session from 'express-session';
import uuid from 'node-uuid';

import { ExpressUtil, HttpError, Logger } from 'alien-util';
import { Database, IdGenerator, Matcher, MemoryItemStore, SystemStore, TestItemStore } from 'alien-core';

import {
  apiRouter,

  Firebase,
  FirebaseItemStore
} from 'alien-api';

import {
  getIdToken,
  isAuthenticated,
  loginRouter,
  oauthRouter,

  OAuthProvider,
  OAuthRegistry,
  ServiceRegistry,
  UserManager,

  GoogleOAuthProvider,
  GoogleDriveQueryProcessor,
  GoogleDriveServiceProvider,
  GoogleMailServiceProvider
} from 'alien-services';

import { Loader } from './data/loader';
import { TestGenerator } from './data/testing';

import { adminRouter } from './router/admin';
import { appRouter } from './router/app';
import { clientRouter, ClientManager } from './router/client';
import { hotRouter } from './router/hot';
import { loggingRouter } from './router/log';

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
    await this.initServices();

    await this.initHandlebars();
    await this.initApp();
    await this.initPages();
    await this.initAdmin();

    await this.initErrorHandling();

    await this.reset();

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

    this._settingsStore = new MemoryItemStore(this._idGenerator, this._matcher, Database.NAMESPACE.SETTINGS, false);

    this._systemStore = new SystemStore(
      new FirebaseItemStore(new IdGenerator(), this._matcher, this._firebase.db, Database.NAMESPACE.SYSTEM, false));

    this._userDataStore = __TESTING__ ?
      // TODO(burdon): Config file for testing options.
      new TestItemStore(new MemoryItemStore(this._idGenerator, this._matcher, Database.NAMESPACE.USER), { delay: 0 }) :
      new FirebaseItemStore(new IdGenerator(), this._matcher, this._firebase.db, Database.NAMESPACE.USER, true);

    // TODO(burdon): ItemStore/QueryProcessor.
    // TODO(burdon): Distinguish search from basic lookup (e.g., Key-range implemented by ItemStore).
    this._database = new Database()
      .registerItemStore(this._systemStore)
      .registerItemStore(this._settingsStore)
      .registerItemStore(this._userDataStore)

      .registerQueryProcessor(this._systemStore)
      .registerQueryProcessor(this._settingsStore)
      .registerQueryProcessor(this._userDataStore)

      .onMutation((context, itemMutations, items) => {
        // TODO(burdon): Options.
        // TODO(burdon): QueryRegistry.
        // Notify clients of changes.
        this._clientManager.invalidateClients(context.clientId);
      });

    //
    // External query processors.
    //

    this._database
      .registerQueryProcessor(new GoogleDriveQueryProcessor(this._idGenerator, _.get(this._config, 'google')));
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
   * Application services.
   */
  initServices() {

    // Service registry.
    this._serviceRegistry = new ServiceRegistry()
      .registerProvider(new GoogleDriveServiceProvider(this._googleAuthProvider))
      .registerProvider(new GoogleMailServiceProvider(this._googleAuthProvider));
//    .registerProvider(new SlackServiceProvider());

    // Client manager.
    this._clientManager = new ClientManager(this._config, this._idGenerator);

    // Client registration.
    this._app.use('/client', clientRouter(this._userManager, this._clientManager, this._systemStore));
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

    // Session used by passport.
    this._app.use(session({
      secret: ENV.ALIEN_SESSION_SECRET,
      resave: false,                        // Don't write to the store if not modified.
      saveUninitialized: false,             // Don't save new sessions that haven't been initialized.
      genid: req => uuid.v4()
    }));

    // Logging.
    // TODO(burdon): Prod logging.
    if (__PRODUCTION__ && false) {
      this._app.use('/', loggingRouter({}));
    } else {
      this._app.use((req, res, next) => {
        if (req.method === 'POST') {
          logger.log(req.method, req.url);
        }

        // Continue to actual route.
        next();
      });
    }
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

    this._app.get('/welcome', isAuthenticated('/home'), (req, res) => {
      res.render('home', {});
    });

    this._app.get('/profile', isAuthenticated('/home'), (req, res, next) => {
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

    this._app.get('/services', isAuthenticated('/home'), (req, res) => {
      res.render('services', {
        providers: this._serviceRegistry.providers
      });
    });
  }

  /**
   * Admin pages and services.
   */
  initAdmin() {

    this._app.use('/admin', adminRouter(this._clientManager, this._firebase, {

      scheduler: false, // TODO(burdon): ???

      handleDatabaseDump: (__PRODUCTION__ ? () => {
        return this._userDataStore.dump().then(debug => {
          logger.log('Database:\n', JSON.stringify(debug, null, 2));
        });
      } : null),

      handleDatabaseReset: (__PRODUCTION__ ? () => {
        return this.reset();
      } : null)
    }));
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
   * Reset the datastore.
   */
  // TODO(burdon): Factor out testing and admin startup tools.
  reset() {
    _.each([ Database.NAMESPACE.USER, Database.NAMESPACE.SETTINGS ], namespace => {
      this._database.getItemStore(namespace).clear();
    });

    let loader = new Loader(this._database);
    return Promise.all([
      // TODO(burdon): Testing only?
      loader.parse(require(
        path.join(ENV.APP_SERVER_DATA_DIR, './accounts.json')), Database.NAMESPACE.SYSTEM, /^(Group)\.(.+)\.(.+)$/),
      loader.parse(require(
        path.join(ENV.APP_SERVER_DATA_DIR, './folders.json')), Database.NAMESPACE.SETTINGS, /^(Folder)\.(.+)$/)
    ]).then(() => {
      logger.log('Initializing groups...');
      return loader.initGroups().then(() => {
        if (__TESTING__) {
          logger.log('Generating test data...');
          return new TestGenerator(this._database).generate();
        }
      });
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
