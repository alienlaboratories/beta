//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';
import express from 'express';

import { Logger } from 'alien-util';
import { GoogleMailClient, GoogleOAuthProvider, isAuthenticated } from 'alien-services';

const logger = Logger.get('profile');

/**
 * Admin endpoints.
 */
export const profileRouter = (config, systemStore) => {
  console.assert(config && systemStore);
  let router = express.Router();

  let gmail = new GoogleMailClient();

  router.post('/api', isAuthenticated(), (req, res) => {
    let user = req.user;
    let { action } = req.body;

    switch (action) {
      case 'subscribe.gmail': {
        let topic = _.get(config, 'google.pubsub.topic.gmail');
        let credentials = _.get(user, 'credentials.google');
        let authClient = GoogleOAuthProvider.createAuthClient(_.get(config, 'google'), credentials);
        return gmail.watch(authClient, topic).then(repsonse => {
          let { historyId, expiration } = repsonse;

          // TODO(burdon): Separate store for sync state.
          _.set(user, 'sync.google.mail.pubsub', {
            historyId,
            expiration
          });

          return systemStore.updateUser(user);
        });
      }
    }
  });

  return router;
};
