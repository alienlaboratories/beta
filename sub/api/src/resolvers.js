//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';

import { Kind } from 'graphql';
import { concatenateTypeDefs } from 'graphql-tools';

import { Logger, HttpError, TypeUtil } from 'alien-util';
import { Database, ID, ItemStore } from 'alien-core';

//
// WARNING: GQL fles may be cached by babel-node/jest
// BABEL_DISABLE_CACHE=1 and/or jest --no-cache to troubleshoot.
//

import Framework from './gql/framework.graphql';
import Schema from './gql/schema.graphql';

const logger = Logger.get('resolver');

/**
 * Resolver map.
 */
export class Resolvers {

  // TODO(burdon): Remove (should be part of namespace query).
  static getNamespaceForType(type) {
    switch (type) {
      case 'User':
      case 'Group':
        return Database.NAMESPACE.SYSTEM;

      case 'Folder':
        return Database.NAMESPACE.SETTINGS;

      default:
        return Database.NAMESPACE.USER;
    }
  }

  static get typeDefs() {
    return concatenateTypeDefs([ Framework, Schema ]);
  }

  //
  // TODO(burdon): Better wrapper.
  //

  static DefaultItem = {
    version: (obj, args, context) => {
      return obj.version || 0;
    }
  };

  /**
   * GraphQL Resolvers.
   * http://dev.apollodata.com/tools/graphql-tools/resolvers.html#Resolver-map
   * http://dev.apollodata.com/tools/graphql-tools/resolvers.html#Resolver-function-signature
   * http://dev-blog.apollodata.com/graphql-explained-5844742f195e#.vcfu43qao
   *
   * The context is set via the apiRouter's contextProvider.
   *
   * context: {
   *   userId,
   *   clientId
   * }
   */
  static getResolverMap(database) {
    console.assert(database);

    // TODO(burdon): Modularize
    // http://dev.apollodata.com/tools/graphql-tools/generate-schema.html#modularizing

    return {

      //
      // Custom types.
      // http://dev.apollodata.com/tools/graphql-tools/scalars.html
      // http://graphql.org/graphql-js/type/#graphqlscalartype
      //

      /**
       * Milliseconds since Unix epoch (_.now() === Date.now()).
       */
      Timestamp: {
        __serialize: value => value,
        __parseValue: value => value,
        __parseLiteral: ast => {
          return (ast.kind === Kind.INT) ? parseInt(ast.value) : null;
        }
      },

      // Bucket: {
      //   __serialize: value => value,
      //   __parseValue: value => value,
      //   __parseLiteral: ast => {
      //     return (ast.kind === Kind.STRING) ? ast.value : null;
      //   }
      // },

      //
      // Interfaces.
      // http://dev.apollodata.com/tools/graphql-tools/resolvers.html#Unions-and-interfaces
      //

      Item: {
        __resolveType(obj) {
          // TODO(burdon): Check type map.
          console.assert(obj.type, 'Invalid type: ' + TypeUtil.stringify(obj));

          // The type property maps onto the GraphQL schema type name.
          return obj.type;
        }
      },

      Folder: _.assign({}, Resolvers.DefaultItem, {}),

      //
      // Type resolvers:
      // http://dev.apollodata.com/tools/graphql-tools/resolvers.html#Resolver-function-signature
      // http://dev.apollodata.com/tools/graphql-tools/resolvers.html#Resolver-result-format
      //
      // Resolver Tree:
      // https://dev-blog.apollodata.com/graphql-explained-5844742f195e
      //
      // field: (obj, args, context, info) => {null|[]|Promise|scalar|Object} result
      //

      Group: _.assign({}, Resolvers.DefaultItem, {

        members: (obj, args, context) => {
          return database.getItemStore(Database.NAMESPACE.SYSTEM).getItems(context, 'User', obj.members);
        },

        projects: (obj, args, context) => {
          // NOTE: Group Items should not directly reference User store items (so we query for them).
          let filter = {
            type: 'Project',
            expr: {
              field: 'group',
              ref: 'id'
            }
          };

          return database.getQueryProcessor(Database.NAMESPACE.USER).queryItems(context, obj, filter);
        }
      }),

      User: _.assign({}, Resolvers.DefaultItem, {

        title: (obj) => {
          if (!obj.displayName) {
            logger.warn('Missing displayName: ' + obj.id);
          }
          return obj.displayName || '';
        },

        // TODO(burdon): Generalize for filtered items (like queryItems). Can reference context and obj node.
        tasks: (obj, args, context) => {
          let { filter } = args || {};
          return database.getItemStore().queryItems(context, obj, filter);
        },

        groups: (obj) => {
          // TODO(madadam): Intersect with groups visible to the Viewer.
          // TODO(madadam): Different interface to get SystemStore. getGroup() is not a method of ItemStore interface.
          return database.getItemStore(Database.NAMESPACE.SYSTEM).getGroups(obj.id);
        }
      }),

      Project: _.assign({}, Resolvers.DefaultItem, {

        boards: (obj, args, context) => {
          return _.map(_.get(obj, 'boards'), board => ({
            alias: board.alias,
            title: board.title || '',
            columns: board.columns,

            // Flatten map to an array.
            itemMeta: _.map(_.get(board, 'itemMeta'), (value, itemId) => ({ itemId, ...value }))
          }));
        },

        group: (obj, args, context) => {
          return database.getItemStore(Database.NAMESPACE.SYSTEM).getItem(context, 'Group', obj.group);
        },

        tasks: (obj, args, context) => {
          if (obj.tasks) {
            return database.getItemStore(Database.NAMESPACE.USER).getItems(context, 'Task', obj.tasks);
          } else {
            return [];
          }
        },

        contacts: (obj, args, context) => {
          if (obj.contacts) {
            return database.getItemStore(Database.NAMESPACE.USER).getItems(context, 'Contact', obj.contacts);
          }
        }
      }),

      Task: _.assign({}, Resolvers.DefaultItem, {

        status: (obj, args, context) => {
          return obj.status || 0;
        },

        project: (obj, args, context) => {
          if (obj.project) {
            return database.getItemStore(Database.NAMESPACE.USER).getItem(context, 'Project', obj.project);
          }
        },

        tasks: (obj, args, context) => {
          if (obj.tasks) {
            return database.getItemStore(Database.NAMESPACE.USER).getItems(context, 'Task', obj.tasks);
          } else {
            return [];
          }
        },

        owner: (obj, args, context) => {
          console.assert(obj.owner);
          return database.getItemStore(Database.NAMESPACE.SYSTEM).getItem(context, 'User', obj.owner);
        },

        assignee: (obj, args, context) => {
          if (obj.assignee) {
            return database.getItemStore(Database.NAMESPACE.SYSTEM).getItem(context, 'User', obj.assignee);
          }
        }
      }),

      Contact: _.assign({}, Resolvers.DefaultItem, {

        tasks: (obj, args, context) => {
          if (obj.tasks) {
            return database.getItemStore(Database.NAMESPACE.USER).getItems(context, 'Task', obj.tasks);
          } else {
            return [];
          }
        },

        messages: (obj, args, context) => {
          if (obj.messages) {
            return database.getItemStore(Database.NAMESPACE.USER).getItems(context, 'Message', obj.messages);
          } else {
            return [];
          }
        },

        // TODO(burdon): Assign User Contact on Login.
        user: (obj, args, context) => {
          if (obj.email) {
            let filter = {
              type: 'User',
              expr: {
                field: 'email',
                value: {
                  string: obj.email
                }
              }
            };

            // TODO(madadam): Factor out with Slackbot.getUserByEmail.
            let queryProcessor = database.getQueryProcessor(Database.NAMESPACE.SYSTEM);
            return queryProcessor.queryItems({}, {}, filter)
              .then(items => {
                if (items.length > 0) {
                  console.assert(items.length === 1);
                  return items[0];
                }
              });
          }
        }
      }),

      //
      // Root Viewer.
      //

      Viewer: {

        user: (obj, args, context) => {
          let { userId } = context;
          return database.getItemStore(Database.NAMESPACE.SYSTEM).getItem(context, 'User', userId);
        },

        groups: (obj, args, context) => {
          let { buckets } = context;
          return database.getItemStore(Database.NAMESPACE.SYSTEM).getItems(context, 'Group', buckets);
        },

        folders: (obj, args, context) => {
          return database.getQueryProcessor(Database.NAMESPACE.SETTINGS).queryItems(context, obj, {
            type: 'Folder',
            orderBy: {
              field: 'order'
            }
          });
        }
      },

      //
      // Queries
      // NOTE: obj is undefined for root-level queries.
      //

      RootQuery: {

        viewer: (obj, args, context) => {
          Resolvers.checkAuthentication(context);

          return {};
        },

        item: (obj, args, context) => {
          Resolvers.checkAuthentication(context);
          let { key: { type, id } } = args;

          // TODO(burdon): Should be from key and/or request (move to client). Or prevent querying directly?
          let namespace = Resolvers.getNamespaceForType(type);

          return database.getItemStore(namespace).getItem(context, type, id);
        },

        search: (obj, args, context) => {
          Resolvers.checkAuthentication(context);

          let { filter } = args;

          return database.search(context, obj, filter);
        }
      },

      //
      // Mutations
      // Apply ItemMutationInput
      // http://dev.apollodata.com/react/receiving-updates.html
      //

      RootMutation: {

        batchMutation: (obj, args, context) => {
          Resolvers.checkAuthentication(context);

          // TODO(burdon): Enforce bucket.

          let { namespace=Database.NAMESPACE.USER, itemMutations } = args;
          logger.log(`UPDATE[${namespace}]: ` + TypeUtil.stringify(itemMutations));

          let itemStore = database.getItemStore(namespace);
          return ItemStore.applyMutations(itemStore, context, itemMutations)

            //
            // Trigger notifications.
            //
            .then(items => {

              // TODO(burdon): Move mutation notifications to Notifier/QueryRegistry.
              database.fireMutationNotification(context, itemMutations, items);

              return items;
            })

            //
            // Response.
            //
            .then(items => {
              // TODO(burdon): Don't return keys at top-level (confused with items).
              return {
                keys: _.map(items, item => ID.key(item))
              };
            });
        }
      }
    };
  }

  static checkAuthentication(context) {
    if (!context.userId) {
      // TODO(burdon): Test user is active also.
      // NOTE: getUserFromHeader should have already thrown before getting here.
      throw new HttpError(401);
    }
  }
}
