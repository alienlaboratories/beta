//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';
import AWS from 'aws-sdk';

import { Queue } from 'alien-scheduler';

import { Command } from './command';

/**
 * Task commands.
 */
export class TaskCommand extends Command {

  constructor(config) {
    super(config);

    // https://aws.amazon.com/sdk-for-node-js
    // http://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/webpack.html
    // http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Config.html#constructor-property
    // http://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/setting-credentials-node.html

    // TODO(burdon): Different instance?
    AWS.config.update({
      region:           _.get(config, 'aws.region'),
      accessKeyId:      _.get(config, 'aws.users.scheduler.aws_access_key_id'),
      secretAccessKey:  _.get(config, 'aws.users.scheduler.aws_secret_access_key')
    });

    this._sqs = new AWS.SQS();

    this._queue = new Queue(_.get(config, 'aws.sqs.tasks'));
  }

  get command() {
    return {
      command: 'task <cmd>',
      describe: 'Task managment.',
      builder: yargs => yargs

        .command({
          command: 'list',
          describe: 'List messages.',
          handler: Command.handler(argv => {
            return new Promise((resolve, reject) => {
              this._sqs.listQueues({}, (err, data) => {
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
