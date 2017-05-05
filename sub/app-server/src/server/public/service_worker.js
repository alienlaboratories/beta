//
// Copyright 2017 Alien Labs.
//

//
// NOTE: This file must be served from the root path.
//

/**
 * Async initialization (fetches config from server).
 * @returns {Promise}
 */
function initialize() {

  // Get App config.
  // https://developers.google.com/web/updates/2015/03/introduction-to-fetch
  console.log('Loading config...');
  return fetch('/app/service_worker_config.json').then(response => {
    return response.json().then(config => {
      console.log('Config = ' + JSON.stringify(config));
      let { messagingSenderId } = config;

      // TODO(burdon): Update version?
      // Give the service worker access to Firebase Messaging.
      // Note that you can only use Firebase Messaging here;
      // other Firebase libraries are not available in the service worker.
      importScripts('https://www.gstatic.com/firebasejs/3.9.0/firebase-app.js');
      importScripts('https://www.gstatic.com/firebasejs/3.9.0/firebase-messaging.js');

      // Initialize the Firebase app in the service worker.
      firebase.initializeApp({
        messagingSenderId
      });

      // TODO(burdon): Do notifications?
      // Retrieve an instance of Firebase Messaging so that it can handle background messages.
      firebase.messaging().setBackgroundMessageHandler(data => {
        console.log('Message:', JSON.stringify(data));
      });
    });
  });
}

/**
 * Custom service worker initializes firebase cloud messaging.
 * https://firebase.google.com/docs/cloud-messaging/js/receive
 * https://firebase.google.com/docs/reference/js/firebase.messaging.Messaging#useServiceWorker
 */
self.addEventListener('install', function(event) {
  console.log('Initializing...');
  event.waitUntil(initialize().then(() => { console.log('Initialized.'); }));
});
