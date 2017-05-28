//
// Copyright 2017 Alien Labs.
//

/**
 * Base class for Tasks.
 */
export class Task {

  /**
   * Execute the task.
   * @param data Task data.
   * @returns {Promise}
   */
  async execTask(data) {
    throw new Error('Not implemented');
  }
}
