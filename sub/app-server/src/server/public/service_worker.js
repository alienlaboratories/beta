//
// Copyright 2017 Alien Labs.
//

/**
 * Service worker script.
 * NOTE: This is loaded via FirebaseCloudMessenger.
 * NOTE: This file must be served from the root path.
 *
 * On load, the script requests the app's config.
 *
 * DEBUG: Dev Tools > Applications > Service Workers.
 * Logs appear in main console (see service_worker.js filename).
 *
 * Custom service worker initializes firebase cloud messaging.
 *
 * https://developers.google.com/web/fundamentals/instant-and-offline/service-worker/lifecycle
 * 1). After loading, receives "install" event (once only). (Will not receive fetch/push until active).
 * 2). Then then "activate" event is fired.
 *
 */
self.addEventListener('install', (event) => {
  console.log('Installing...');

  // TODO(burdon): How to update service worker?

  // TODO(burdon): Error handling: display SW status?
  // NOTE: SWs are shared across multiple tabs (from same origin).
  // On error, reload from Dev Tools.

  const initialize = () => {
    console.log('Loading config...');

    // Request App config.
    // https://developers.google.com/web/updates/2015/03/introduction-to-fetch
    return fetch('/app/service_worker_config.json')
      .then(response => {
        return response.json().then(config => {
          console.log('Config = ' + JSON.stringify(config));
          let { messagingSenderId } = config;

          // TODO(burdon): Grab version from config/package.json?
          // Give the service worker access to Firebase Messaging.
          // Note that you can only use Firebase Messaging here since
          // other Firebase libraries are not available in the service worker.
          // https://firebase.google.com/docs/cloud-messaging/js/receive
          // https://firebase.google.com/docs/reference/js/firebase.messaging.Messaging#useServiceWorker
          importScripts('https://www.gstatic.com/firebasejs/4.2.0/firebase-app.js');
          importScripts('https://www.gstatic.com/firebasejs/4.2.0/firebase-messaging.js');

          // Initialize the Firebase app in the service worker.
          // eslint-disable-next-line no-undef
          firebase.initializeApp({
            messagingSenderId
          });

          // Retrieve an instance of Firebase Messaging so that it can handle background messages.
          // https://firebase.google.com/docs/reference/js/firebase.messaging.Messaging#setBackgroundMessageHandler
          // eslint-disable-next-line no-undef
          firebase.messaging().setBackgroundMessageHandler(data => {
            // TODO(burdon): Show notification -- or trigger sync anyway.
            // NOTE: This is called if Chrome doesn't currently have focus.
            console.log('Message:', JSON.stringify(data));
          });
        });
      });
  };

  // Pass promise.
  event.waitUntil(initialize());
});

self.addEventListener('activate', (event) => {
  console.log('Activated.');
});
