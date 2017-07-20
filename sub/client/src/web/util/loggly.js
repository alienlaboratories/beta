//
// Copyright 2017 Alien Labs.
//

/**
 * Loggly wrapper.
 * https://www.loggly.com/docs/javascript
 */
export class Loggly {

  constructor(config) {
    if (!window._LTracker) {
      console.warn('Loggly not configured');
      return;
    }

    this._tracker = window._LTracker;
    this._tracker.push({
      token:      _.get(config, 'loggly.token'),
      subdomain:  _.get(config, 'loggly.subdomain'),
      tags:      [_.get(config, 'app.platform')]
    });
  }

  log() {
    this._tracker && this._tracker.push(...arguments);
  }
}
