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

  get command() {
    return {
      command: 'query <type>',
      describe: 'Query GraphQL API.',
      handler: Command.handler(argv => {
        let query = DEFAULT_QUERY;
        let variables = {};

        if (argv.type) {
          query = 'query SearchQuery($filter: FilterInput) { search(filter: $filter) { items { bucket, id, type, title } } }';
          variables = {
            filter: {
              type: argv.type
            }
          };
        }

        return this.authenticate().then(token => {
          let options = {
            url: this.getUrl(API_URL),
            headers: AuthUtil.setAuthHeader({
              'Content-Type': 'application/json',
            }, token),
            body: JSON.stringify({
              query,
              variables
            })
          };

          return new Promise((resolve, reject) => {
            request.post(options, (error, response, body) => {
              if (error) {
                reject(error);
              } else {
                let { data } = JSON.parse(body);
                console.log(JSON.stringify(data, null, 2));
                resolve(data);
              }
            });
          });
        });
      })
    };
  }
}
