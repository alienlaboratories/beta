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

  static typeOf(value) {
    if (_.isString(value)) {
      return 'String';
    } else if (_.isNumber(value)) {
      return 'Number';
    } else if (_.isBoolean(value)) {
      return 'Binary';
    } else {
      throw new Error('Invalid value: ' + value);
    }
  }

  constructor(url) {
    console.assert(url);
    this._url = url;
    this._sqs = new AWS.SQS();
  }

  /**
   * Adds a task.
   *
   * @param {{ type }} attributes
   * @param {Object} data
   * @returns {Promise}
   */
  add(attributes, data={}) {
    return Queue.promisify(callback => {
      logger.log('Adding task: ' + TypeUtil.stringify(attributes));

      let MessageAttributes = {};
      _.each(attributes, (value, key) => {
        MessageAttributes[key] = {
          DataType: Queue.typeOf(value),
          [ Queue.typeOf(value) + 'Value' ]: value
        };
      });

      // http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SQS.html#sendMessage-property
      this._sqs.sendMessage({
        QueueUrl: this._url,
        MessageAttributes,
        MessageBody: JSON.stringify(data)
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
    return Queue.promisify(callback => {

      // http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SQS.html#receiveMessage-property
      this._sqs.receiveMessage({
        QueueUrl: this._url,
        AttributeNames: 'All',
        MaxNumberOfMessages: 1,
        VisibilityTimeout: 60,
        WaitTimeSeconds: 60
      }, callback);

    }).then(data => {
      if (!data) {
        return Promise.resolve(0);
      }

      let { Messages } = data;
      return Promise.all(_.map(Messages, message => {
        let { ReceiptHandle, MessageAttributes, Body } = message;

        let data = JSON.parse(Body);

        return handler(MessageAttributes, data).then(() => {

          // Remove the task.
          // NOTE: Tasks must be idempotent.
          // TODO(burdon): Check didn't timeout.
          return Queue.promisify(callback => {

            // http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SQS.html#deleteMessage-property
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
