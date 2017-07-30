//
// Copyright 2017 Alien Labs.
//

import express from 'express';

import { ExpressUtil, Logger } from 'alien-util';
import { isAuthenticated } from 'alien-services';

const logger = Logger.get('admin');

/**
 * Admin endpoints.
 */
export const adminRouter = (config, systemStore, clientManager, options) => {
  console.assert(config && clientManager && options);
  let router = express.Router();

  //
  // Admin pages.
  //

  router.get('/', isAuthenticated('/home', true), (req, res) => {
    return clientManager.getClients().then(clients => {
      res.render('admin/config', {
        env: options.env,
        config,
        routes: ExpressUtil.stack(options.app)
      });
    });
  });

  router.get('/clients', isAuthenticated('/home', true), (req, res) => {
    return clientManager.getClients().then(clients => {
      res.render('admin/clients', {
        testing: __TESTING__,
        clients
      });
    });
  });

  router.get('/users', isAuthenticated('/home', true), (req, res, next) => {
    return systemStore.queryItems({}, {}, { type: 'User' }).then(users => {
      res.render('admin/users', { users });
    }).catch(next);
  });

  //
  // Admin API.
  //

  router.post('/api', isAuthenticated(undefined, true), (req, res) => {
    let { action, clientId } = req.body;

    const ok = () => {
      res.send({});
    };

    logger.log('Admin command:', action);
    switch (action) {

      case 'client.flush': {
        return clientManager.flushClients().then(ok);
      }

      case 'client.invalidate': {
        return clientManager.invalidateClient(clientId).then(ok);
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
  // if (options.scheduler) {
  //   router.use('/kue', kue.app);
  // } else {
  //   router.use('/kue', (req, res) => {
  //     res.redirect('/admin');
  //   });
  // }

  return router;
};
