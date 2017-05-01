//
// Copyright 2017 Alien Labs.
//

/**
 * App-wide constants.
 */
export const Const = {

  DOM_ROOT: 'app-root',

  APP_PATH: '/app',

  APP_NAME: 'robotik',

  // NOTE: Changed by grunt:version
  APP_VERSION: "0.0.2",

  // NOTE: Express lowercases headers.
  HEADER: {

    // Client ID set by server (Web) or on registration (CRX, mobile).
    CLIENT_ID: 'alien-client',

    // Use by Apollo network middleware to track request/response messages.
    REQUEST_ID: 'alien-request'
  }
};
