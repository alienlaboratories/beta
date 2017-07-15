//
// Copyright 2017 Alien Labs.
//

import AWS from 'aws-sdk';

import { Command } from './command';

/**
 * Task commands.
 */
export class TaskCommand extends Command {

  constructor(config) {
    super(config);

    this._sqs = new AWS.SQS();
  }

  // https://aws.amazon.com/sdk-for-node-js
  // http://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/webpack.html

  exec(args) {
    switch (args.db_command) {

      case 'list': {
        return new Promise((resolve, reject) => {
          this._sqs.listQueues({}, (err, data) => {
            if (err) {
              reject(err);
            } else {
              console.log('###########', data);
            }
          });
        });
      }
    }
  }
}