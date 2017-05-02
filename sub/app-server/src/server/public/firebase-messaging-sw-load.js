//
// Copyright 2017 Alien Labs.
//

// Loaded by Firebase Messaging.
// https://firebase.google.com/docs/cloud-messaging/js/receive

/**
 * Do async initialization.
 */
function initialize() {
  // Get App config.
  // https://developers.google.com/web/updates/2015/03/introduction-to-fetch
  // return fetch('/app/sw_config').then(response => {
  //   return response.json().then(data => {
  //     console.log('############', data);
  //     let { messagingSenderId } = data;

      // Give the service worker access to Firebase Messaging.
      // Note that you can only use Firebase Messaging here;
      // other Firebase libraries are not available in the service worker.
      importScripts('https://www.gstatic.com/firebasejs/3.5.2/firebase-app.js');
      importScripts('https://www.gstatic.com/firebasejs/3.5.2/firebase-messaging.js');

      // Initialize the Firebase app in the service worker.
      firebase.initializeApp({
        messagingSenderId: '933786919888'
      });

      // TODO(burdon): Do notifications.
      // Retrieve an instance of Firebase Messaging so that it can handle background messages.
      // firebase.messaging().setBackgroundMessageHandler(payload => {
      //   console.log('Message:', payload);
      // });
  //   });
  // });
  return Promise.resolve();
}

/**
 * https://firebase.google.com/docs/reference/js/firebase.messaging.Messaging#useServiceWorker
 */
self.addEventListener('install', function(event) {
  console.log('Initializing...');
  event.waitUntil(initialize().then(() => { console.log('Initialized.'); }));
});
