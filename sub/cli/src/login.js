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

  exec(args) {
    return this.authenticate();
  }
}
