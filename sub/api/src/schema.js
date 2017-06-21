//
// Copyright 2017 Alien Labs.
//

import { makeExecutableSchema } from 'graphql-tools';

import { Logger } from 'alien-util';

import { Resolvers } from './resolvers';

const logger = Logger.get('schema');

/**
 * Item implementations.
 */
// TODO(burdon): Generate JSON from schema.
export const ITEM_TYPES = [
  'User', 'Group', 'Contact', 'Document', 'Event', 'Folder', 'Location', 'Message', 'Project', 'Task'
];

/**
 * Client/server enums.
 */
export const Enum = {

  /**
   * Task levels.
   */
  // TODO(burdon): Make property of specific board.
  TASK_LEVEL: {

    UNSTARTED:  0,
    ACTIVE:     1,
    COMPLETE:   2,
    BLOCKED:    3,

    // Enums with properties in javascript: https://stijndewitt.com/2014/01/26/enums-in-javascript
    properties: {
      0: { title: 'Unstarted' },
      1: { title: 'Active' },
      2: { title: 'Complete' },
      3: { title: 'Blocked' }
    }
  }
};

/**
 * Utils used by app and tests.
 */
export class SchemaUtil {

  static createSchema(database) {
    console.assert(database);

    // http://dev.apollodata.com/tools/graphql-tools/generate-schema.html#makeExecutableSchema
    return makeExecutableSchema({

      // Debugging.
//    allowUndefinedInResolve: false,
//    resolverValidationOptions: {},

      // Schema defs.
      // WARNING: babel caches these fles (use jest --no-cache to troubleshoot).
      typeDefs: Resolvers.typeDefs,

      // Resolvers.
      // http://dev.apollodata.com/tools/graphql-tools/resolvers.html
      resolvers: Resolvers.getResolverMap(database),

      // Log resolver errors (formatError returns message to client).
      // https://github.com/apollographql/graphql-tools/issues/291
      // https://github.com/graphql/graphql-js/pull/402
      logger: {
        log: (error) => {
          logger.error('GraphQL Schema Error: ' + error);
        }
      }
    });
  }
}
