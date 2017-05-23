//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';
import request from 'request';

import { Logger, TypeUtil } from 'alien-util';
import { Const } from 'alien-core';

const logger = Logger.get('push');

/**
 * Push manager.
 */
export class PushManager {

  /**
   * @param {{ messagingSenderId }} config
   */
  constructor(config) {
    console.assert(config);
    this._config = config;
  }

  /**
   * Send push message.
   *
   * @param platform Client platform.
   * @param senderId Client ID of sender.
   * @param messageToken
   * @param force
   * @return {Promise}
   */
  sendMessage(platform, messageToken, senderId=undefined, force=false) {
    return new Promise((resolve, reject) => {
      console.assert(platform && messageToken);

      // TODO(burdon): Query invalidation message (see CloudMessenger).
      // NOTE: key x value pairs only.
      // https://firebase.google.com/docs/cloud-messaging/http-server-ref#downstream-http-messages-json
      let data = {
        command: 'invalidate',
        senderId,
        force
      };

      let url;
      switch (platform) {
        case Const.PLATFORM.CRX:
          // https://developers.google.com/cloud-messaging/downstream
          url = 'https://gcm-http.googleapis.com/gcm/send';
          break;

        case Const.PLATFORM.WEB:
        default:
          // https://firebase.google.com/docs/cloud-messaging/http-server-ref
          url = 'https://fcm.googleapis.com/fcm/send';
          break;
      }

      let options = {
        url,

        // https://firebase.google.com/docs/cloud-messaging/server#auth
        // https://github.com/request/request#custom-http-headers
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'key=' + _.get(this._config, 'serverKey')
        },

        body: JSON.stringify({
          // No support for multiple recipients.
          to: messageToken,
          data
        })
      };

      // TODO(burdon): Replace with sendToDevice (see fbdemo). FB only?
      // admin.messaging().sendToDevice(messageToken, { data })

      // Post authenticated request to GCM/FCM endpoint.
      // https://firebase.google.com/docs/cloud-messaging/server
      logger.log('Sending message: ' + messageToken, TypeUtil.stringify(data));
      request.post(options, (error, response, body) => {
        if (error || response.statusCode !== 200) {
          throw new Error(`Messaging Error [${response.statusCode}]: ${error || response.statusMessage}`);
        } else {
          resolve();
        }
      });
    });
  }
}
