//
// Copyright 2017 Alien Labs.
//

import { makeExecutableSchema } from 'graphql-tools';

import { Logger } from 'alien-util';

import { Resolvers } from './resolvers';

const logger = Logger.get('schema');

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
