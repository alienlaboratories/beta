//
// Copyright 2016 Alien Labs.
//

/**
 * Client/server App defs.
 */
export const Const = {

  // Client platform.
  PLATFORM: {
    WEB: 'web',
    CRX: 'crx',
    MOBILE: 'mobile'
  },

  // NOTE: Express lowercases headers.
  HEADER: {

    // Client ID set by server (Web) or on registration (CRX, mobile).
    CLIENT_ID: 'alien-client',

    // Use by Apollo network middleware to track request/response messages.
    REQUEST_ID: 'alien-request'
  }
};

export const LABEL = {
  FAVORITE:   '_favorite',
  DELETED:    '_deleted'
};
