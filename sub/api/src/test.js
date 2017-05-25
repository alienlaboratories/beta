//
// Copyright 2017 Alien Labs.
//

export const Test = 100;

import _ from 'lodash';

import { Kind } from 'graphql';

import { Logger, HttpError, TypeUtil } from 'alien-util';
import { Database, ItemStore } from 'alien-core';

const logger = Logger.get('resolver');

/**
 * Resolver map.
 */
export class Resolvers {

  static getResolverMap(database) {
    console.assert(database);

    return {

      Project: {

        boards: (obj, args, context) => {
          // return _.map([], v => v);
          // return {
          //   x: _.map([], v => v)      // TODO(burdon): Error.
          // };
          let a = { foo: 100 };
          return _.map(_.get(obj, 'boards'), board => ({
            itemMeta: { ...a }
          }));
          // return _.map(_.get(obj, 'boards'), board => ({
          //   itemMeta: _.map(_.get(board, 'itemMeta'), (value, itemId) => ({ itemId, ...value }))
          // }));
        }
      }

    };
  }

}
