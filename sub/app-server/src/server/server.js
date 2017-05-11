//
// Copyright 2017 Alien Labs.
//

import * as fs from 'fs';
import _ from 'lodash';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import express from 'express';
import favicon from 'serve-favicon';
import handlebars from 'express-handlebars';
import http from 'http';
import path from 'path';
import session from 'express-session';
import uuid from 'uuid';

import { ExpressUtil, HttpError, HttpUtil, Logger } from 'alien-util';
import { AuthUtil, Database, IdGenerator, Matcher, MemoryItemStore, SystemStore, TestItemStore } from 'alien-core';
import { AppDefs } from 'alien-client';
import { apiRouter } from 'alien-api';
import { Loader, TestGenerator } from 'alien-services';

import {
  getIdToken,
  isAuthenticated,
  loginRouter,
  oauthRouter,

  Firebase,
  FirebaseItemStore,

  OAuthProvider,
  OAuthRegistry,
  ServiceRegistry,
  UserManager,

  AlienAnalyzerServiceProvider,
  AlienExtractorServiceProvider,

  GoogleOAuthProvider,
  GoogleCalendarServiceProvider,
  GoogleDriveQueryProcessor,
  GoogleDriveServiceProvider,
  GoogleMailServiceProvider,
  GooglePlusServiceProvider,

  SlackServiceProvider
} from 'alien-services';

import { adminRouter } from './router/admin';
import { appRouter } from './router/app';
import { clientRouter, ClientManager } from './router/client';
import { hotRouter } from './router/hot';
import { loggingRouter } from './router/log';

import { Const } from '../common/defs';

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
      ENV,
      config: this._config
    };
  }

  async init() {
    logger.log('Initializing...');

    await this.initDatabase();
    await this.initMiddleware();
    await this.initAuth();
    await this.initServices();

    await this.initApp();
    await this.initApi();

    await this.initHandlebars();
    await this.initPages();
    await this.initAdmin();

    if (!__PRODUCTION__) {
      await this.initTesting();
    }

    await this.initErrorHandling();

    await this.reset();

    return this;
  }

  /**
   * Database and query processors.
   */
  initDatabase() {
    logger.log('initDatabase');

    // NOTE: The seed provide repeatable IDs in dev but not production.
    this._idGenerator = new IdGenerator(!__PRODUCTION__ && 1234);

    // Query item matcher.
    this._matcher = new Matcher();

    // Firebase
    // https://firebase.google.com/docs/database/admin/start
    this._firebase = new Firebase(_.get(this._config, 'firebase'));

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

    // Default login.
    this._googleAuthProvider = new GoogleOAuthProvider(_.get(this._config, 'google'), ENV.APP_SERVER_URL);

    this._database
      .registerQueryProcessor(new GoogleDriveQueryProcessor(this._googleAuthProvider));
  }

  /**
   * Authentication and user/client management.
   */
  initAuth() {
    logger.log('initAuth');

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
    logger.log('initServices');

    // Service registry.
    this._serviceRegistry = new ServiceRegistry()
      .registerProvider(new GoogleCalendarServiceProvider(this._googleAuthProvider))
      .registerProvider(new GoogleDriveServiceProvider(this._googleAuthProvider))
      .registerProvider(new GoogleMailServiceProvider(this._googleAuthProvider))
      .registerProvider(new GooglePlusServiceProvider(this._googleAuthProvider))
      .registerProvider(new SlackServiceProvider())
      .registerProvider(new AlienAnalyzerServiceProvider())
      .registerProvider(new AlienExtractorServiceProvider());

    // Client manager.
    this._clientManager = new ClientManager(this._config, new IdGenerator());

    // Client registration.
    this._app.use('/client', clientRouter(this._userManager, this._clientManager, this._systemStore));
  }

  /**
   * Express middleware.
   */
  initMiddleware() {
    logger.log('initMiddleware');

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

    this._app.use('/', loggingRouter({}));
  }

  /**
   * Handlebars.
   * https://github.com/ericf/express-handlebars
   */
  initHandlebars() {
    logger.log('initHandlebars');

    // Set local variables for Handlebars.
    this._app.use((req, res, next) => {
      res.locals = {
        user: req.user
      };

      next();
    });

    const helpers = _.assign(ExpressUtil.Helpers, {

      // {{ global "env" }}
      global: (key) => {
        return _.get({
          env: __ENV__,
          version: Const.APP_VERSION
        }, key);
      },

      // {{#if (env "production")}} ... {{/if}}
      env: (key) => {
        return key === __ENV__;
      }
    });

    this._app.engine('handlebars', handlebars({
      layoutsDir: path.join(ENV.APP_SERVER_VIEWS_DIR, '/layouts'),
      partialsDir: path.join(ENV.APP_SERVER_VIEWS_DIR, '/partials'),
      defaultLayout: 'main',
      helpers,
      partials: {
        foo: ''
      }
    }));

    this._app.set('view engine', 'handlebars');
    this._app.set('views', ENV.APP_SERVER_VIEWS_DIR);
  }

  /**
   * Client application.
   */
  initApp() {
    logger.log('initApp');

    //
    // Hot loader.
    // NOTE: Must come above other asset handlers.
    //
    if (__HOT__) {
      this._app.use(hotRouter({

        // Bundle definitions.
        webpackConfig: require('../../webpack-web.config')
      }));
    }

    //
    // Web app.
    //
    this._app.use(AppDefs.APP_PATH, appRouter(this._config, this._clientManager, {

      // Webpack bundles.
      assets: ENV.APP_SERVER_ASSETS_DIR
    }));
  }

  /**
   * GraphQL API.
   */
  initApi() {

    // Register the API router.
    this._app.use('/api', apiRouter(this._database, {

      // API request.
      graphql: '/graphql',

      // Log each request.
      logging: true,

      //
      pretty: false,

      // Use custom UX provided below.
      graphiql: false,

      // Asynchronously provides the request context.
      contextProvider: (req) => {
        let user = req.user;
        console.assert(user);

        // If authenticated.
        let userId = user.active && user.id;

        // The database context (different from the Apollo context).
        // NOTE: The client must pass the same context shape to the matcher.
        let context = {
          userId,
          credentials: user.credentials,

          // TODO(burdon): Why is this needed?
          clientId: req.headers[AppDefs.HEADER.CLIENT_ID]
        };

        if (!userId) {
          return Promise.resolve(context);
        } else {
          // Get buckets.
          return this._systemStore.getGroups(userId).then(groups => {
            return _.assign(context, {
              buckets: _.map(groups, group => group.id)
            });
          });
        }
      }
    }));
  }

  /**
   * Handlebars pages.
   * https://github.com/ericf/express-handlebars#metadata
   */
  initPages() {
    logger.log('initPages');

    this._app.get('/', (req, res) => {
      res.redirect('/home');
    });

    this._app.get('/home', (req, res) => {
      res.render('home', {
        layout: 'home',
        title: AppDefs.APP_NAME,
        redirectUrl: '/profile'
      });
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
    logger.log('initAdmin');

    // Status.
    this._app.get('/status', (req, res, next) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify({
        env: __ENV__,
        version: Const.APP_VERSION
      }, null, 2));
    });

    // TODO(burdon): Permissions.
    // Admin pages and services.
    this._app.use('/admin', adminRouter(this._config, this._systemStore, this._clientManager, {

      env: ENV,

      app: this._app,

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
   * Testing pages.
   */
  initTesting() {

    // TODO(burdon): Create router.

    // Canned GraphQL queries.
    const queries = [
      { title: 'TYPES', query: '{ __schema { types { kind name possibleTypes { name } } } }' }
    ];

    _.each(queries, spec => {
      spec.url = HttpUtil.toUrl(AppDefs.GRAPHIQL_PATH, { query: spec.query });
    });

    // Testing home.
    this._app.get('/testing', isAuthenticated(), (req, res) => {
      res.render('testing/home', { queries });
    });

    // Test CRX.
    this._app.get('/testing/crx', isAuthenticated(), (req, res) => {
      res.render('testing/crx');
    });

    // Register the GraphiQL test console.
    this._app.get(AppDefs.GRAPHIQL_PATH, isAuthenticated(), (req, res) => {
      let headers = {};
      AuthUtil.setAuthHeader(headers, getIdToken(req.user));
      headers[AppDefs.HEADER.CLIENT_ID] = req.query.clientId;
      res.render('testing/graphiql', {
        config: {
          graphql: AppDefs.GRAPHQL_PATH,
          headers
        }
      });
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
    logger.log('initErrorHandling');

    // Handle missing resource.
    this._app.use((req, res, next) => {
      throw new HttpError(404, req.url);
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
        if (json) {
          res.status(err.code).end();
        } else {
          res.render('error', { code, err });
//        res.redirect('/');
        }
      }
    });
  }

  /**
   * Reset the datastore.
   */
  // TODO(burdon): Factor out testing and admin startup tools.
  reset() {
    logger.log('reset');

    if (__TESTING__) {
      _.each([Database.NAMESPACE.USER, Database.NAMESPACE.SETTINGS], namespace => {
        this._database.getItemStore(namespace).clear();
      });
    }

    let loader = new Loader(this._database);
    return Promise.all([
      // TODO(burdon): Testing only?
      loader.parse(JSON.parse(fs.readFileSync(path.join(ENV.APP_SERVER_DATA_DIR, 'accounts.json'), 'utf8')),
        Database.NAMESPACE.SYSTEM, /^(Group)\.(.+)\.(.+)$/),
      loader.parse(JSON.parse(fs.readFileSync(path.join(ENV.APP_SERVER_DATA_DIR, 'folders.json'), 'utf8')),
        Database.NAMESPACE.SETTINGS, /^(Folder)\.(.+)$/)
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
   * Start the app.
   * @return {Promise.<WebServer>}
   */
  start() {
    logger.log('start...');
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
