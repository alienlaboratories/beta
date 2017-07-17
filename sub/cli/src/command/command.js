//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';
import url from 'url';

import { Authenticator } from '../util/auth';

/**
 * Base class for commands.
 */
export class Command {

  // TODO(burdon): Async? https://github.com/yargs/yargs/issues/918
  static handler(handler) {
    return (argv => {
      argv._result = handler(argv);
    });
  }

  constructor(config) {
    console.assert(config);
    this._config = config;
  }

  get config() {
    return this._config;
  }

  /**
   * Returns yargs command module.
   * https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module
   *
   * @returns {{ command, aliases, describe, builder, handler }}
   */
  get command() {
    return {};
  }

  getUrl(path) {
    console.assert(path);
    return url.resolve(global.ENV.ALIEN_SERVER_URL, path);
  }

  authenticate() {
    return new Authenticator(_.get(this._config, 'google.cli'), global.ENV.ALIEN_SERVER_URL).authenticate();
  }

  exec(args) {
    throw new Error('Not implemented');
  }
}
