//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';
import url from 'url';

import { Authenticator } from './auth';

/**
 * Base class for commands.
 */
export class Command {

  constructor(config) {
    console.assert(config);
    this._config = config;
  }

  getUrl(path) {
    console.assert(path);
    return url.resolve(_.get(this._config, 'server'), path);
  }

  authenticate() {
    return new Authenticator(this._config).authenticate();
  }

  exec(args) {
    throw new Error('Not implemented.');
  }
}
