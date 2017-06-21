//
// Copyright 2017 Alien Labs.
//

import { Logger } from './logger';
import { TypeUtil } from './type';

const logger = Logger.get('event');

/**
 * Injectable event handler.
 */
export class EventListener {

  constructor() {
    this._counter = 0;

    // Map of callbacks by ID (so can be revoked).
    this._callbacks = new Map();
  }

  /**
   * Listen for events.
   * @param type Filter by type (or '*').
   * @param callback Listener callback.
   *
   * @returns {function} Function to unregister listener.
   */
  listen(type, callback) {
    console.assert(type && callback);

    let id = 'C-' + ++this._counter;
    this._callbacks.set(id, {
      type: type,
      callback: callback
    });

    return () => {
      this._callbacks.delete(id);
    };
  }

  /**
   * Send event.
   * @param event
   */
  emit(event) {
    console.assert(event.type);
    logger.log('Emit: ' + TypeUtil.stringify(event));

    this._callbacks.forEach(spec => {
      if (spec.type === '*' || spec.type === event.type) {
        spec.callback(event);
      }
    });
  }
}
