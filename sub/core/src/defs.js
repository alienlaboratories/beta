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

/**
 * Client/server enums.
 */
export const Enum = {

  /**
   * Task levels.
   */
  TASK_LEVEL: {

    UNSTARTED:  0,
    ACTIVE:     1,
    COMPLETE:   2,
    BLOCKED:    3,

    // Enums with properties in javascript: https://stijndewitt.com/2014/01/26/enums-in-javascript
    properties: {
      0: { title: 'Unstarted' },
      1: { title: 'Active' },
      2: { title: 'Complete' },
      3: { title: 'Blocked' }
    }
  }
};

/**
 * Item implementations.
 */
// TODO(burdon): Generate from schema.
export const ITEM_TYPES = [
  'User', 'Group', 'Contact', 'Document', 'Event', 'Folder', 'Location', 'Message', 'Project', 'Task'
];
