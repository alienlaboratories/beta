//
// Copyright 2017 Alien  Labs.
//

import _ from 'lodash';
import express from 'express';
//import kue from 'kue';

import { isAuthenticated } from 'alien-services';

/**
 * Admin endpoints.
 */
export const adminRouter = (config, clientManager, options) => {
  console.assert(config && clientManager && options);
  let router = express.Router();

  // Kue.
  // TODO(burdon): Factor out config.
  // Environment variables set by kubernetes deployment config.
  let queue = null;
  // if (options.scheduler) {
  //   queue = kue.createQueue({
  //     redis: {
  //       host: _.get(process.env, 'REDIS_KUE_SERVICE_HOST', '127.0.0.1'),
  //       port: _.get(process.env, 'REDIS_KUE_SERVICE_PORT', 6379),
  //       db: 0
  //     }
  //   }).on('error', err => {
  //     console.warn('Kue Error:', err.code);
  //   });
  // }

  //
  // Admin pages.
  //

  router.get('/', isAuthenticated('/home', true), (req, res) => {
    return clientManager.getClients().then(clients => {
      res.render('admin/admin', {
        testing: __TESTING__,
        clients
      });
    });
  });

  router.get('/config', isAuthenticated('/home', true), (req, res) => {

    // TODO(burdon): ExpressUtil.
    // http://thejackalofjavascript.com/list-all-rest-endpoints
    let routes = _.compact(_.map(options.app._router.stack, item => {
      let { route, path, regexp } = item;
      console.log('####', item);
      if (route) {
        return {
          path: route.path || route.regexp
        };
      } else {
        let stack = _.get(item, 'handle.stack');
        if (!_.isEmpty(stack)) {
          return {
            path: path || regexp,             // TODO(burdon): !!!
            sub: _.map(stack, item => {
              console.log('==', item);
              let { route, path } = item;
              if (route || path) {
                return path || route.path || route.regexp;
              }
            })
          };
        }
      }
    }));

    return clientManager.getClients().then(clients => {
      res.render('admin/config', {
        env: options.env,
        config: this._config,
        routes
      });
    });
  });

  router.get('/ops', isAuthenticated('/home', true), (req, res) => {
    res.render('admin/ops');
  });

  //
  // Admin API.
  // TODO(burdon): Authenticate.
  //

  router.post('/api', isAuthenticated(undefined, true), (req, res) => {
    let { action, clientId } = req.body;

    const ok = () => {
      res.send({});
    };

    console.log('Admin command: %s', action);
    switch (action) {

      case 'client.flush': {
        return clientManager.flush().then(ok);
      }

      case 'client.invalidate': {
        return clientManager.invalidateClient(clientId).then(ok);
      }

      case 'schedule.test': {
        queue && queue.create('test', {}).save();
        break;
      }
    }

    if (__TESTING__) {
      switch (action) {

        case 'database.dump': {
          return options.handleDatabaseDump().then(ok);
        }

        case 'database.reset': {
          return options.handleDatabaseReset().then(ok);
        }
      }
    }

    ok();
  });

  //
  // https://github.com/Automattic/kue#user-interface
  //
  if (options.scheduler) {
    router.use('/kue', kue.app);
  } else {
    router.use('/kue', (req, res) => {
      res.redirect('/admin');
    });
  }

  return router;
};
