//
// Copyright 2017 Alien Labs.
//

import request from 'request';

import { Command } from './command';

// TODO(burdon): Const.
const STATUS_URL = '/status';

/**
 * Status command.
 */
export class StatusCommand extends Command {

  constructor(config) {
    super(config);
  }

  get command() {
    return {
      command: 'status',
      describe: 'Server status.',
      handler: Command.handler(argv => {
        return new Promise((resolve, reject) => {
          request(this.getUrl(STATUS_URL), (error, response, body) => {
            if (error) {
              reject(error);
            } else {
              let data = JSON.parse(body);
              console.log(JSON.stringify(data, null, 2));
              resolve(data);
            }
          });
        });
      })
    };
  }
}
