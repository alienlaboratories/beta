//
// Copyright 2017 Alien Labs.
//

// Loaded by Firebase Messaging.
// https://firebase.google.com/docs/cloud-messaging/js/receive#handle_messages_when_your_web_app_is_in_the_foreground

// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here;
// other Firebase libraries are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/3.5.2/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/3.5.2/firebase-messaging.js');

// Initialize the Firebase app in the service worker.
firebase.initializeApp({
  messagingSenderId: '933786919888'
});

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

// TODO(burdon): Do notifications.
messaging.setBackgroundMessageHandler(payload => {
  console.log('Message:', payload);
});
