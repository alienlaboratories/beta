//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';
import AWS from 'aws-sdk';

import { Logger, TypeUtil } from 'alien-util';

const logger = Logger.get('queue');

/**
 * Queue wrapper (Bull implementation).
 */
export class Queue {

  // TODO(burdon): Test from CLI.
  // TODO(burdon): System test.

  // http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SQS.html
  static promisify(f) {
    return new Promise((resolve, reject) => {
      f((err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }

  constructor(url) {
    console.assert(url);
    this._urn = url;
    this._sqs = new AWS.SQS();
  }

  /**
   * Adds a task.
   *
   * @param {{}} task
   * @returns {Promise}
   */
  add(task, attributes) {
    // http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SQS.html#sendMessage-property
    return Queue.promisify(callback => {
      logger.log('Adding task: ' + TypeUtil.stringify(task));
      this._sqs.sendMessage({
        QueueUrl: this._url,
        MessageBody: JSON.stringify(task)
      }, callback);
    });
  }

  /**
   * Sets the job processor.
   *
   * @param {function.<{Data}>} handler Handler returns a promise.
   * @returns {Queue}
   */
  process(handler) {
    // http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SQS.html#receiveMessage-property
    return Queue.promisify(callback => {
      this._sqs.receiveMessage({
        QueueUrl: this._url,
        MaxNumberOfMessages: 1,
        VisibilityTimeout: 60,
        WaitTimeSeconds: 60                               // TODO(burdon): Loop.
      }, callback);
    }).then(data => {
      if (!data) {
        return Promise.resolve(0);
      }

      let { Messages } = data;
      return Promise.all(_.map(Messages, message => {
        let { ReceiptHandle, Body } = message;

        // Process task.
        let task = JSON.parse(Body);
        return handler(task).then(() => {

          // Remove the task.
          // NOTE: Tasks must be idempotent.
          // TODO(burdon): Check didn't timeout.
          // http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SQS.html#deleteMessage-property
          return Queue.promisify(callback => {
            this._sqs.deleteMessage({
              QueueUrl: this._url,
              ReceiptHandle
            }, callback);
          }).then(() => ReceiptHandle);
        });
      }));
    }).then(values => _.size(values));
  }
}
