//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';
import AWS from 'aws-sdk';

import { AWSUtil, AWSQueue } from 'alien-services';

import { Command } from './command';

/**
 * Task commands.
 */
export class QueueCommand extends Command {

  constructor(config) {
    super(config);

    // https://aws.amazon.com/sdk-for-node-js
    // http://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/webpack.html
    // http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Config.html#constructor-property
    // http://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/setting-credentials-node.html

    AWSUtil.config(config);

    this._sqs = new AWS.SQS();

    this._queue = new AWSQueue(_.get(config, 'aws.sqs.tasks'));
  }

  // TODO(burdon): Make this SQS (q) command (not task).
  // TODO(burdon): Use Promisify (and handle errors).

  get command() {
    return {
      command: 'sqs <cmd>',
      aliases: ['q'],
      describe: 'SQS managment.',
      builder: yargs => yargs

        .command({
          command: 'list',
          describe: 'List queues.',
          handler: Command.handler(argv => {
            return new Promise((resolve, reject) => {
              // http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SQS.html#listQueues-property
              this._sqs.listQueues({}, (err, data) => {
                if (err) {
                  reject(err);
                } else {
                  console.log(JSON.stringify(_.get(data, 'QueueUrls'), null, 2));
                  resolve();
                }
              });
            });
          })
        })

        .command({
          command: 'info <queue>',
          describe: 'Queue info',
          handler: Command.handler(argv => {
            let { queue } = argv;

            return new Promise((resolve, reject) => {
              // http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SQS.html#getQueueAttributes-property
              this._sqs.getQueueAttributes({
                QueueUrl: queue,
                AttributeNames: ['All']
              }, (err, data) => {
                if (err) {
                  reject(err);
                } else {
                  console.log(JSON.stringify(data, null, 2));
                  resolve();
                }
              });
            });
          })
        })

        .command({
          command: 'purge <queue>',
          describe: 'Purge queue.',
          handler: Command.handler(argv => {
            let { queue } = argv;

            return new Promise((resolve, reject) => {
              // http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SQS.html#purgeQueue-property
              this._sqs.purgeQueue({
                QueueUrl: queue
              }, (err, data) => {
                if (err) {
                  reject(err);
                } else {
                  console.log(JSON.stringify(data, null, 2));
                  resolve();
                }
              });
            });
          })
        })

        .command({
          command: 'add <queue> [params...]',
          describe: 'Add task.',
          handler: Command.handler(argv => {
            let { queue, params } = argv;

            // q add sync.google.mail userId:google-116465153085296292090
            let attributes = {};
            _.each(params, param => {
              let keyValue = param.split(':');
              attributes[keyValue[0]] = keyValue[1];
            });

            return new Promise((resolve, reject) => {
              // http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SQS.html#purgeQueue-property
              this._sqs.sendMessage({
                QueueUrl: queue,
                MessageAttributes: AWSUtil.objectToAttributes(attributes),
                MessageBody: JSON.stringify({})
              }, (err, data) => {
                if (err) {
                  reject(err);
                } else {
                  console.log(JSON.stringify(data, null, 2));
                  resolve();
                }
              });
            });
          })
        })

        // TODO(burdon): Separate AWS/queue abstraction.
        .command({
          command: 'task <type> [params...]',
          describe: 'Add task.',
          handler: Command.handler(argv => {
            let { type, params } = argv;

            let attributes = {
              type
            };

            // q add sync.google.mail userId:google-116465153085296292090
            _.each(params, param => {
              let keyValue = param.split(':');
              attributes[keyValue[0]] = keyValue[1];
            });

            return this._queue.add(attributes);
          })
        })

        .help()
    };
  }
}
