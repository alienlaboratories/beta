//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';
import express from 'express';

import { ExpressUtil, Logger } from 'alien-util';
import { isAuthenticated, AWSQueue } from 'alien-services';

const logger = Logger.get('admin');

/**
 * Admin endpoints.
 */
export const adminRouter = (config, systemStore, clientManager, options) => {
  console.assert(config && clientManager && options);
  let router = express.Router();

  let queue = new AWSQueue(_.get(config, 'aws.sqs.tasks'));

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
        return clientManager.flush().then(ok);
      }

      case 'client.invalidate': {
        return clientManager.invalidateClient(clientId).then(ok);
      }

      case 'task': {
        let { task } = req.body;
        let { type, userId } = task;

        // TODO(burdon): List users.
        // TODO(burdon): Send userIds and client maps with task.
        // let users = await this._database.getQueryProcessor(Database.NAMESPACE.SYSTEM).queryItems({}, {}, { type: 'User' });

        return clientManager.getClients().then(clients => {
          return queue.add({
            type,
            userId,

            data: {

              // TODO(burdon): Temp send client map (until persistent and can be accessed by scheduler.
              clients: _.map(clients, client => _.pick(client, 'userId', 'platform', 'messageToken'))
            }
          }).then(ok);
        });
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
