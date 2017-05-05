//
// Copyright 2016 Alien Labs.
//

/**
 * Client/server App defs.
 */
export const AppDefs = {

  // Changed via grunt:version
  APP_VERSION: '0.0.1',

  // Name for static components (e.g., CRX).
  APP_NAME: 'robotik',

  // Root router path.
  APP_PATH: '/app',

  // API path.
  GRAPHQL_PATH: '/api/graphql',
  GRAPHIQL_PATH: '/debug/graphiql',

  // Root DOM element.
  DOM_ROOT: 'app-root',

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

/**
 * Client/server enums.
 */
export const Enum = {

  /**
   * Task levels.
   */
  TASK_LEVEL: {

    UNSTARTED: 0,
    ACTIVE: 1,
    COMPLETE: 2,
    BLOCKED: 3,

    // Enums with properties in javascript: https://stijndewitt.com/2014/01/26/enums-in-javascript
    properties: {
      0: { title: 'Unstarted' },
      1: { title: 'Active' },
      2: { title: 'Complete' },
      3: { title: 'Blocked' }
    }
  }
};
