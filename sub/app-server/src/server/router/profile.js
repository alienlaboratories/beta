//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';
import express from 'express';

import { Logger } from 'alien-util';
import { GoogleCalendarClient, GoogleMailClient, GoogleOAuthHandler, isAuthenticated } from 'alien-services';

const logger = Logger.get('profile');

/**
 * Admin endpoints.
 */
export const profileRouter = (config, systemStore, options={}) => {
  console.assert(config && systemStore && options);
  let { serverUrl } = options;

  let router = express.Router();

  router.post('/api', isAuthenticated(), (req, res) => {
    let user = req.user;
    let { action } = req.body;

    let credentials = _.get(user, 'credentials.google');
    let authClient = GoogleOAuthHandler.createAuthClient(_.get(config, 'google'), credentials);

    switch (action) {
      case 'subscribe': {
        let { service } = req.body;

        switch (service) {

          case 'google.com/mail': {
            let client = new GoogleMailClient();
            let topic = _.get(config, 'google.pubsub.topic.gmail.id');
            return client.watch(authClient, topic).then(repsonse => {
              let { historyId, expiration } = repsonse;

              // TODO(burdon): Separate store for sync state.
              _.set(user, 'service.google.mail.subscription', { historyId, expiration });
              return systemStore.updateUser(user);
            });
          }

          case 'google.com/calendar': {
            let client = new GoogleCalendarClient();
            // TODO(burdon): Const.
            let channelId = 'xxx';
            let webhookUrl = serverUrl + '/hook/XXX';
            return client.watch(authClient, channelId, webhookUrl).then(repsonse => {
              let { expiration } = repsonse;

              // TODO(burdon): Separate store for sync state.
              _.set(user, 'service.google.calendar.subscription', { expiration });
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
