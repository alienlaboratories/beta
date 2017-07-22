//
// Copyright 2017 Alien Labs.
//

/**
 * Queue wrapper.
 */
export class Queue {

  /**
   * Adds a task.
   *
   * @param {{ type }} attributes
   * @param {Object} data
   * @returns {Promise}
   */
  add(attributes, data={}) {
    throw new Error('Not implemented');
  }

  /**
   * Sets the job processor.
   *
   * @param {function.<{Attributes, Data}>} handler Handler returns a promise.
   * @returns {Queue}
   */
  process(handler) {
    throw new Error('Not implemented');
  }
}
