//
// Copyright 2017 Alien Labs.
//

import admin from 'firebase-admin';

import { Logger } from 'alien-util';

const logger = Logger.get('firebase');

/**
 * Firebase datastore.
 * https://firebase.google.com/docs/database
 * https://firebase.google.com/docs/reference/js/firebase.database.Database
 *
 * Console:
 * https://console.firebase.google.com
 *
 * NOTE: Firebase requires the server's clock to be in sync with NTP.
 * http://stackoverflow.com/questions/30115933/access-token-and-refresh-token-giving-invalid-grant-in-google-plus-in-python/30117441#30117441
 */
export class Firebase {

  /**
   * Creates the Firebase singleton app and wraps utils.
   *
   * @param {{ app, serviceAccount }} config Firebase config.
   */
  constructor(config) {

    // https://firebase.google.com/docs/admin/setup
    // https://firebase.google.com/docs/reference/admin/node/admin
    this._app = admin.initializeApp({
      databaseURL: config.app.databaseURL,
      credential: admin.credential.cert((config.serviceAccount))
    });

    // NOTE: Clock-skew will cause API calls to hang (without errors).
    // This can happen on minikube due to the computer sleeping.
    // https://firebase.google.com/docs/reference/admin/node/admin.database
    admin.database.enableLogging(message => {
      if (message.indexOf('Error') !== -1) {
        logger.error(message);
      }
    });

    this._db = this._app.database();

    logger.info('Initialized: ' + config.databaseURL);
  }

  get db() {
    return this._db;
  }
}
