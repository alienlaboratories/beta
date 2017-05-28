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

  static of(config, callback) {
    let command = new Command(config);
    command.exec = callback.bind(command);
    return command;
  }

  constructor(config) {
    console.assert(config);
    this._config = config;
  }

  get config() {
    return this._config;
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
