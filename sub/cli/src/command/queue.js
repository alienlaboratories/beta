//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';
import AWS from 'aws-sdk';

import { Queue } from 'alien-services';

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

    AWS.config.update({
      region:           _.get(config, 'aws.region'),
      accessKeyId:      _.get(config, 'aws.users.scheduler.aws_access_key_id'),
      secretAccessKey:  _.get(config, 'aws.users.scheduler.aws_secret_access_key')
    });

    this._sqs = new AWS.SQS();

    this._queue = new Queue(_.get(config, 'aws.sqs.tasks'));
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

        // TODO(burdon): Task queue specific? (Make Queue SQS abstraction not task specific).
        .command({
          command: 'add <type>',
          describe: 'Add task.',
          handler: Command.handler(argv => {
            let { type } = argv;
            return this._queue.add({
              type
            });
          })
        })

        .help()
    };
  }
}
