//
// Copyright 2017 Alien Labs.
//

import { Logger } from './logger';
import { TypeUtil } from './type';

const logger = Logger.get('event');

/**
 * Injectable event handler.
 */
// TODO(burdon): Rename EventListener.
export class EventHandler {

  constructor() {
    // Map of callbacks by ID (so can be revoked).
    this._callbacks = [];
  }

  /**
   * Listen for events.
   * @param type Filter by type (or '*').
   * @param callback Listener callback.
   */
  listen(type, callback) {
    console.assert(type && callback);
    this._callbacks.push({
      type: type,
      callback: callback
    });
    return this;
  }

  /**
   * Send event.
   * @param event
   */
  emit(event) {
    console.assert(event.type);
    logger.log('Emit: ' + TypeUtil.stringify(event));
    _.each(this._callbacks, config => {
      if (config.type === '*' || config.type === event.type) {
        config.callback(event);
      }
    });
  }
}
