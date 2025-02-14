//
// Copyright 2017 Alien Labs.
//

// Only install messaging.
// https://firebase.google.com/docs/web/setup
import firebase from 'firebase/app';
import 'firebase/messaging';

import { Async, ErrorUtil, Logger } from 'alien-util';

const logger = Logger.get('cloud');

/**
 * Base class for Google Cloud Messaging.
 */
class CloudMessenger {

  // TODO(burdon): Provide callback to re-register with server when token expires.

  /**
   * Registers client (and push socket).
   *
   * @param {object} config
   * @param {EventListener} eventListener
   */
  constructor(config, eventListener) {
    console.assert(config && eventListener);
    this._config = config;
    this._eventListener = eventListener;
    this._onTokenUpdate = null;
    this._onMessage = null;

    // Timer to prevent multiple push invalidations within time period.
    this._messages = [];
    this._delay = Async.delay(1000);
  }

  /**
   * Set callback called when the token is automatically refreshed.
   * @param onTokenUpdate
   */
  onTokenUpdate(onTokenUpdate) {
    this._onTokenUpdate = onTokenUpdate;
    return this;
  }

  /**
   * Register callback.
   * @param onMessage
   */
  listen(onMessage) {
    this._onMessage = onMessage;
    return this;
  }

  /**
   * Register with the FCM/GCM server.
   * @return {Promise<pushToken>}
   */
  connect() {
    throw new Error('Not implemented.');
  }

  /**
   * Unregister with the FMC/GCM server.
   */
  disconnect() {
    throw new Error('Not implemented.');
  }

  /**
   * Message callback.
   * @param data
   */
  fireMessage(data) {
    logger.info('Received: ' + JSON.stringify(data));
    this._eventListener.emit({ type: 'network.recv' });

    // Ignore invalidations from self.
    let { senderId, force } = data;
    if (force || _.get(this._config, 'client.id') !== senderId) {
      // TODO(burdon): Batch on server?
      // TODO(burdon): Use collapse key to determine if first message can be skipped.
      this._messages.push(data);
      this._delay(() => {
        if (this._messages.length > 1) {
          logger.warn('Collapsing messages: ' + JSON.stringify(this._messages));
        }

        this._onMessage && this._onMessage(data);
        this._messages = [];
      });
    }
  }
}

/**
 * FCM for Web push messages.
 *
 * https://firebase.google.com/docs/cloud-messaging/js/client
 * https://github.com/firebase/quickstart-js/blob/master/messaging/index.html
 *
 * NOTE: Uses a service worker, which requires serving a manifest.json which contains the gcm_sender_id.
 */
export class FirebaseCloudMessenger extends CloudMessenger {

  // TODO(burdon): Config.
  static TIMEOUT = 1000;

  // TODO(burdon): Instance API (server side admin for client).
  // https://developers.google.com/instance-id/reference/server#get_information_about_app_instances

  connect() {
    // TODO(burdon): Ask for permissions before app is loaded (otherwise timesout).
    // NOTE: Timesout if user is presented with permissions prompt (requires reload anyway).
    return Async.abortAfter(() => {

      //
      // To debug: DevTools > Application > Service Workers.
      //
      // https://developers.google.com/web/fundamentals/getting-started/primers/service-workers
      // http://stackoverflow.com/questions/41659970/firebase-change-the-location-of-the-service-worker
      //
      // NOTE: Must be served from root path.
      // NOTE: SW is only loaded on first load by the page that references it (unless unregistered).
      // NOTE: Currently warnings (5/4/17): FB service ticket.
      // firebase-messaging.js:26 Event handler of 'push' event must be added on the initial evaluation of worker script.
      //
      logger.log('Loading Service Worker...');
      return navigator.serviceWorker.register('/service_worker.js').then(registration => {

        // https://console.firebase.google.com/project/alien-dev/overview
        firebase.initializeApp(_.get(this._config, 'firebase'));

        // https://firebase.google.com/docs/reference/js/firebase.messaging.Messaging#useServiceWorker
        firebase.messaging().useServiceWorker(registration);

        // https://firebase.google.caom/docs/cloud-messaging/js/receive#handle_messages_when_your_web_app_is_in_the_foreground
        firebase.messaging().onMessage(message => {
          let { data } = message;
          this.fireMessage(data);
        });

        // The token is updated when the user clears browser data.
        // https://firebase.google.com/docs/cloud-messaging/js/client#monitor-token-refresh
        firebase.messaging().onTokenRefresh(() => {
          firebase.messaging().getToken().then(messageToken => {
            logger.log('Token updated.');
            this._onTokenUpdate && this._onTokenUpdate(messageToken);
          });
        });

        // https://firebase.google.com/docs/cloud-messaging/js/client#request_permission_to_receive_notifications
        logger.log('Requesting permissions...');
        return firebase.messaging().requestPermission().then(() => {

          // NOTE: Requires HTTPS (for Service workers); localhost supported for development.
          // https://developers.google.com/web/fundamentals/getting-started/primers/service-workers#you_need_https
          logger.log('Requesting message token...');
          return firebase.messaging().getToken().then(messageToken => {
            if (!messageToken) {
              throw new Error('FCM Token expired.');
            }

            logger.log('Connected.');
            return messageToken;
          });
        })

        .catch(error => {

          // Errors: error.code
          // - Failed to update a ServiceWorker: The script has an unsupported MIME type ('text/html').
          //   mainfest.json not loaded (LINK in HTML head).
          // - messaging/permission-blocked
          //   TODO(burdon): Show UX warning.
          //   Permission not set (set in Chrome (i) button to the left of the URL bar).
          // - messaging/failed-serviceworker-registration
          //   Invalid Firebase console registration.
          // - messaging/incorrect-gcm-sender-id
          //   manifest.json gcm_sender_id is not project specific.
          throw new Error('FCM registration failed: ' + ErrorUtil.message(error.code));
        });
      });

    }, FirebaseCloudMessenger.TIMEOUT);
  }

  disconnect() {}
}

/**
 * GCM for CRX push messages.
 *
 * https://developer.chrome.com/apps/gcm
 * https://developers.google.com/cloud-messaging/gcm
 *
 * NOTE: manifest.json must contain gcm permission.
 */
export class GoogleCloudMessenger extends CloudMessenger {

  // TODO(burdon): Store token?

  constructor(config, eventListener) {
    super(config, eventListener);

    // https://developer.chrome.com/apps/gcm#event-onMessage
    chrome.gcm.onMessage.addListener(message => {
      let { data/*, from, collapseKey*/ } = message;

      // Use collapseKey to prevent chatty pings.
      // https://developers.google.com/cloud-messaging/chrome/client#collapsible_messages

      // Max message size: 4K.
      this.fireMessage(data);
    });
  }

  // TODO(burdon): Use for upstream messages (XMPP)?
  // https://developers.google.com/cloud-messaging/chrome/client#send_messages

  connect() {
    return new Promise((resolve, reject) => {
      logger.log('Requesting message token...');

      // https://developers.google.com/cloud-messaging/chrome/client
      const projectNumber = _.get(this._config, 'google.projectNumber');
      console.assert(projectNumber, 'Invalid project number.');
      chrome.gcm.register([ projectNumber ], messageToken => {
        if (chrome.runtime.lastError) {
          throw new Error(chrome.runtime.lastError.message);
        }

        logger.log('Connected.');
        resolve(messageToken);
      });
    });
  }

  disconnect() {
    return chrome.gcm.unregister(() => {
      console.assert(!chrome.runtime.lastError);
      logger.log('Disconnected.');
    });
  }
}
