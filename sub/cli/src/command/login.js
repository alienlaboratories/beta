//
// Copyright 2017 Alien Labs.
//

import { Command } from './command';

/**
 * Login and show stats.
 */
export class LoginCommand extends Command {

  constructor(config) {
    super(config);
  }

  get command() {
    return {
      command: 'login',
      describe: 'Authenticate.',
      handler: Command.handler(argv => {
        return this.authenticate();
      })
    };
  }
}
