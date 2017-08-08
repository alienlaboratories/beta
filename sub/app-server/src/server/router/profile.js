//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';
import express from 'express';

import { Logger } from 'alien-util';
import { GoogleMailClient, GoogleOAuthHandler, isAuthenticated } from 'alien-services';

const logger = Logger.get('profile');

/**
 * Admin endpoints.
 */
export const profileRouter = (config, systemStore) => {
  console.assert(config && systemStore);
  let router = express.Router();

  router.post('/api', isAuthenticated(), (req, res) => {
    let user = req.user;
    let { action } = req.body;

    switch (action) {
      case 'subscribe': {
        let { service } = req.body;

        switch (service) {
          case 'google.com/mail': {
            let credentials = _.get(user, 'credentials.google');
            let authClient = GoogleOAuthHandler.createAuthClient(_.get(config, 'google'), credentials);
            let gmail = new GoogleMailClient();
            let topic = _.get(config, 'google.pubsub.topic.gmail.id');
            return gmail.watch(authClient, topic).then(repsonse => {
              let { historyId, expiration } = repsonse;

              // TODO(burdon): Separate store for sync state.
              _.set(user, 'service.google.mail.subscription', { historyId, expiration });
              return systemStore.updateUser(user);
            });
          }

          default: {
            logger.error('Unhandled service: ' + service);
          }
        }
      }
    }
  });

  return router;
};
