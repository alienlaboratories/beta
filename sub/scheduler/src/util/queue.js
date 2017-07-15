//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';
import BullQueue from 'bull';

import { ErrorUtil, Logger, TypeUtil } from 'alien-util';

const logger = Logger.get('queue');

// TODO(burdon): Kill this and SQS. No need for Redis.

/**
 * Queue wrapper (Bull implementation).
 */
export class Queue {

  // https://github.com/luin/ioredis/blob/master/API.md#new-redisport-host-options
  static DEF_OPTS = {
    host: '127.0.0.1',
    port: 6379,

    redis: {
      db: 0,

      // NOTE Called for each connection.
      // https://github.com/luin/ioredis#auto-reconnect
      retryStrategy: (attempt) => {
        logger.warn('Redis connection retry:', attempt);

        // Back-off.
        return Math.min(attempt * 100, 3000);
      }
    }
  };

  static TEST_OPS = {
    redis: {
      retryStrategy: (attempt) => false
    }
  };

  constructor(name, options) {

    // NOTE: ioredis (not redis).
    // https://github.com/luin/ioredis/blob/master/API.md
    // https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#queue
    this._queue = new BullQueue(name, _.defaultsDeep(options, Queue.DEF_OPTS));

    // https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#events
    this._queue.on('ready', () => {
      logger.info('Ready'); // TODO(burdon): Not called.
    });

    this._queue.on('error', (err) => {
      logger.error('Error:', ErrorUtil.message(err));
    });

    this._queue.on('failed', (job, err) => {
      logger.error(`Failed[${job.id}]:`, ErrorUtil.message(err), TypeUtil.stringify(job.data));
      logger.error(err);
    });

    this._queue.on('completed', (job, result) => {
      logger.log(`Complete[${job.id}]:`, TypeUtil.stringify(result));
    });
  }

  /**
   * Adds a job.
   *
   * @param value
   * @returns {Promise}
   */
  add(value) {
    return this._queue.add(value).then(job => {
      logger.log(`Added[${job.id}]`, TypeUtil.stringify(value));
      return job;
    });
  }

  /**
   * Sets the job processor.
   *
   * @param {function.<{Data}, {Job}>} handler
   * @returns {Queue}
   */
  process(handler) {
    this._queue.process(job => {
      logger.log(`Processing[${job.id}]:`, TypeUtil.stringify(job.data));
      return Promise.resolve(handler(job.data, job));
    });

    return this;
  }

  /**
   * Release the connection.
   */
  close() {
    this._queue.close();
  }
}
