//
// Copyright 2017 Alien Labs.
//

import request from 'request';

import { Command } from './command';

import { AuthUtil } from 'alien-core';

// TODO(burdon): Const.
const API_URL = '/api/graphql';

// TODO(burdon): Default query.
// TODO(burdon): Map CLI search commands onto query.
const DEFAULT_QUERY = 'query ViewerQuery { viewer { user { id } } }';

/**
 * API query.
 */
export class QueryCommand extends Command {

  constructor(config) {
    super(config);
  }

  exec(args) {
    return this.authenticate().then(token => {

      let options = {
        url: this.getUrl(API_URL),
        headers: AuthUtil.setAuthHeader({
          'Content-Type': 'application/json',
        }, token),
        body: JSON.stringify({
          query: DEFAULT_QUERY,
          variables: {}
        })
      };

      console.log('Requesting Token...');
      request.post(options, (error, response, body) => {
        if (error) {
          throw error;
        }

        let { data } = JSON.parse(body);
        console.log(JSON.stringify(data, null, 2));
        return data;
      });
    });
  }
}
