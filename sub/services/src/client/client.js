//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';
import express from 'express';
import moment from 'moment';

import { Const } from 'alien-core';
import { Async, HttpError, Logger, TypeUtil } from 'alien-util';

import { hasJwtHeader } from '../auth/oauth';
import { PushManager } from './push';

const logger = Logger.get('client');

/**
 * Client endpoints.
 * @return {Router}
 */
export const clientRouter = (userManager, clientManager, systemStore, options={}) => {
  console.assert(userManager && clientManager);
  let router = express.Router();

  // TODO(burdon): Error handling.

  //
  // Registers the client.
  //
  router.post('/register', hasJwtHeader(), (req, res, next) => {
    let { platform, messageToken } = req.body;
    let user = req.user;

    // Register the client (and create it if necessary).
    let clientId = req.headers[Const.HEADER.CLIENT_ID];
    return clientManager.registerClient(user.id, platform, clientId, messageToken).then(client => {
      if (!client) {
        throw new HttpError(400, 'Invalid client: ' + clientId);
      } else {
        res.send({
          client: _.pick(client, ['id', 'messageToken'])
        });
      }
    }).catch(next);
  });

  //
  // Unregisters the client.
  //
  router.post('/unregister', hasJwtHeader(), (req, res, next) => {
    let clientId = req.headers[Const.HEADER.CLIENT_ID];
    let user = req.user;
    return clientManager.unregisterClient(user.id, clientId).then(() => {
      res.end();
    }).catch(next);
  });

  return router;
};

/**
 * Manages client connections.
 *
 * Web:
 * 1). Server creates client and passes to app config.
 * 2). Client requests FCM token.
 * 3). Client registers with server.
 *
 * CRX:
 * 1). BG page requests FCM token.
 * 2). BG page registers with server.
 * 3). Server creates client and returns config.
 */
export class ClientManager {

  // TODO(burdon): Expire web clients after 1 hour (force reconnect if client re-appears).

  static STALE = 60;

  constructor(config, itemStore) {
    console.assert(config && itemStore);
    this._itemStore = itemStore;

    this._pushManager = new PushManager({
      serverKey: _.get(config, 'firebase.cloudMessaging.serverKey')
    });

    this._context = {
      groupId: 'system'
    };
  }

  /**
   * Flush Web clients that haven't registered.
   */
  flushClients() {
    logger.log('Flushing stale clients...');

    let now = moment().valueOf();
    return this._itemStore.queryItems(this._context, {}, { type: 'Client' }).then(clients => {
      let clientIds = _.compact(_.each(clients, client => {
        if (!client.registered && now.subtract(client.created).seconds() >= ClientManager.STALE) {
          return client.id;
        }
      }));

      return _.size(clientIds) ? this._itemStore.deleteItems(this._context, 'Client', clientIds) : Promise.resolve([]);
    });
  }

  /**
   * Retrun clients sorted by age.
   */
  getClients() {
    return this._itemStore.queryItems(this._context, {}, { type: 'Client' }).then(clients => {
      return clients.sort((a, b) => { return b.registered - a.registered; });
    });
  }

  /**
   * Clients are created at different times for different platforms.
   * Web: Created when the page is served.
   * CRX: Created when the app registers.
   * @param {string} userId
   * @param {string} platform
   * @param {boolean} registered
   * @param {string} messageToken
   * @returns {Promise<Client>}
   */
  createClient(userId, platform, registered=false, messageToken=undefined) {
    console.assert(userId && platform, JSON.stringify({ userId, platform }));

    let ts = moment().valueOf();
    let client = {
      type: 'Client',
      platform,
      userId,
      created: ts,
      registered: registered && ts,
      messageToken: messageToken
    };

    logger.log('Created: ' + JSON.stringify(_.pick(client, ['platform', 'id'])));
    return this._itemStore.upsertItem(this._context, client);
  }

  /**
   * Called by clients on start-up (and to refresh tokens, etc.)
   * NOTE: mobile devices requet ID here.
   * @param {string} userId
   * @param {string} platform
   * @param {string} clientId
   * @param {string} messageToken
   * @returns {Promise<Client>}
   */
  registerClient(userId, platform, clientId=undefined, messageToken=undefined) {
    console.assert(userId && platform, JSON.stringify({ platform, userId }));
    logger.log('Registering: ' + TypeUtil.stringify({ platform, clientId, messageToken }));

    // Get existing client.
    return Async.promiseOf(clientId && this._itemStore.getItem(this._context, 'Client', clientId)).then(client => {
      if (client) {
        // TODO(burdon): Check created time matches?
        // Verify existing client matches registration.
        // NOTE: In testing random number seed is the same, so there may be conflicts.
        if (client.platform !== platform || client.userId !== userId) {
          logger.warn('Existing client does not match: ' + JSON.stringify(client));
          client = null;
        }
      } else if (clientId) {
        logger.warn('Invalid or expired client: ' + clientId);
      }

      if (client) {
        // Update the existing client.
        return this._itemStore.upsertItem(this._context, _.assign(client, {
          registered: moment().valueOf(),
          messageToken
        }));
      } else {
        // Create a new client if required.
        return this.createClient(userId, platform, true, messageToken);
      }
    }).then(client => {
      logger.log('Registered: ' + JSON.stringify(client));
      return client;
    });
  }

  /**
   * Called by web client on page unload.
   * @param userId
   * @param clientId
   * @returns {Promise<{string}>}
   */
  unregisterClient(userId, clientId) {
    console.assert(userId && clientId, JSON.stringify({ userId, clientId }));

    logger.log('UnRegistered: ' + clientId);
    return this._itemStore.deleteItem(this._context, 'Client', clientId);
  }

  /**
   * Invalidate all clients.
   *
   * NOTE: Clients may share the same push token (one per browser), so the sender will also receive the
   * invalidation but may choose to ignore it.
   *
   * @param senderId Client ID of sender.
   * @return {Promise}
   */
  invalidateClients(senderId=undefined) {
    return this._itemStore.queryItems(this._context, {}, { type: 'Client' }).then(clients => {

      // Create map of tokens by platform.
      let messageTokenMap = {};
      _.each(clients, client => {
        if (client.messageToken) {
          console.assert(messageTokenMap[client.messageToken] === undefined ||
                         messageTokenMap[client.messageToken] === client.platform,
            'Multiple platforms for message token: ' + client.messageToken);

          messageTokenMap[client.messageToken] = client.platform;
        }
      });

      if (_.size(messageTokenMap)) {
        // Send to multiple tokens.
        logger.log('Sending invalidations to clients: ' + _.size(messageTokenMap));
        return Promise.all(_.map(messageTokenMap, (platform, messageToken) => {
          return this._pushManager.sendMessage(platform, messageToken, senderId);
        })).catch(error => {
          console.warn('Invalidation failed: ' + error);
        });
      }
    });
  }

  /**
   * Invalidate given client.
   * @param clientId Client to invalidate.
   */
  invalidateClient(clientId) {
    return this._itemStore.getItem(this._context, 'Client', clientId).then(client => {
      if (!client) {
        throw new Error('Invalid client: ' + clientId);
      }

      if (!client.messageToken) {
        logger.warn('No message token for client: ' + clientId);
        return Promise.resolve();
      }

      logger.log('Sending invalidation to client: ' + clientId);
      return this._pushManager.sendMessage(client.platform, client.messageToken, clientId, true);
    });
  }
}
