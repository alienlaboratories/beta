//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';
import AWS from 'aws-sdk';

import { Logger, TypeUtil } from 'alien-util';

import { Queue } from '../queue';

const logger = Logger.get('aws');

/**
 * Queue wrapper (AWS).
 */
export class AWSUtil {

  /**
   * AWS config.
   * @param {{ aws }} config
   * @param {string} user
   */
  static config(config, user='worker') {
    console.assert(user);

    // http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Config.html#constructor-property
    AWS.config.update({
      region:           _.get(config, 'aws.region'),
      accessKeyId:      _.get(config, `aws.users.${user}.aws_access_key_id`),
      secretAccessKey:  _.get(config, `aws.users.${user}.aws_secret_access_key`)
    });
  }

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

  static objectToAttributes(object) {
    console.assert(object);

    let attributes = {};
    _.each(object, (value, key) => {
      attributes[key] = {
        DataType: AWSUtil.typeOf(value),
        [ AWSUtil.typeOf(value) + 'Value' ]: value
      };
    });

    return attributes;
  }

  static attributesToObject(attributes) {
    console.assert(attributes);

    let object = {};
    _.each(attributes, (data, key) => {
      let value;
      switch (data.DataType) {
        case 'String': {
          value = data.StringValue;
          break;
        }

        default:
          throw new Error('Type not handled: ' + data.DataType);
      }

      object[key] = value;
    });

    return object;
  }
}

/**
 * Queue wrapper (AWS).
 */
export class AWSQueue extends Queue {

  constructor(url) {
    super();

    console.assert(url);
    this._url = url;
    this._sqs = new AWS.SQS();
  }

  add(attributes, data={}) {
    return AWSUtil.promisify(callback => {
      logger.log('Adding task: ' + TypeUtil.stringify(attributes));

      // http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SQS.html#sendMessage-property
      this._sqs.sendMessage({
        QueueUrl: this._url,
        MessageAttributes: AWSUtil.objectToAttributes(attributes),
        MessageBody: JSON.stringify(data)
      }, callback);
    });
  }

  remove(ReceiptHandle) {
    return AWSUtil.promisify(callback => {

      // http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SQS.html#deleteMessage-property
      this._sqs.deleteMessage({
        QueueUrl: this._url,
        ReceiptHandle
      }, callback);

    }).then(() => ReceiptHandle);
  }

  process(handler) {
    return AWSUtil.promisify(callback => {
      logger.log('Receiving...');

      // http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SQS.html#receiveMessage-property
      this._sqs.receiveMessage({
        QueueUrl: this._url,
        MessageAttributeNames: ['All'],
        MaxNumberOfMessages: 1,
        VisibilityTimeout: 60,
        WaitTimeSeconds: 20
      }, callback);

    }).then(data => {
      if (!data) {
        return Promise.resolve(0);
      }

      let { Messages } = data;
      return Promise.all(_.map(Messages, message => {
        let { ReceiptHandle, MessageAttributes, Body } = message;

        let attributes = AWSUtil.attributesToObject(MessageAttributes);
        let data = JSON.parse(Body);

        return handler(attributes, data).then(() => {
          logger.log('OK: ' + TypeUtil.truncate(ReceiptHandle, 32));

          // Remove the task.
          // NOTE: Tasks must be idempotent.
          // TODO(burdon): Check didn't timeout.
          return this.remove(ReceiptHandle);
        }).catch(err => {
          err && logger.error(err);

          // TODO(burdon): Delete tasks that fail?
          // http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SQS.html#deleteMessage-property
          return this.remove(ReceiptHandle).then(() => {
            return Promise.reject(new Error(`Job failed: [${TypeUtil.truncate(ReceiptHandle, 32)}]`));
          });
        });
      }));
    }).then(values => _.size(values));
  }
}
