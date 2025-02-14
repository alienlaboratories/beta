//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';

import { Logger } from 'alien-util';
import { LABEL, Database, ID, MutationUtil, Transforms } from 'alien-core';
import { Randomizer } from 'alien-core/src/testing';
import { Enum } from 'alien-api';

const logger = Logger.get('testing');

/**
 * Test data.
 */
export class TestGenerator {

  // TODO(burdon): Created time (in past).
  // TODO(burdon): Should create links (e.g., Project <===> Task.)

  /**
   * Type Generators.
   * @param database
   * @constructor
   */
  static Generators = database => ({

    // TODO(burdon): Return mutations (to multiple items)? Are IDs resolved?
    // TODO(burdon): Create mutations with references (like client side mutator transaction).

    'Project': [

      Randomizer.property('bucket', (item, context, randomizer) => randomizer.chance.pickone(context.buckets)),

      Randomizer.property('group', (item, context) => item.bucket),

      Randomizer.property('title', (item, context, randomizer) =>
        randomizer.chance.sentence({ words: randomizer.chance.natural({ min: 3, max: 5 }) })),

      Randomizer.property('contacts', (item, context, randomizer) => {
        let num = randomizer.chance.natural({ min: 3, max: 5 });
        if (num) {
          // TODO(burdon): Reuse generator? (but same project).
          return database.getItemStore(Database.NAMESPACE.USER).upsertItems(context, _.times(num, i => ({
            type: 'Contact',
            bucket: item.bucket,
            title: randomizer.chance.name(),
            email: randomizer.chance.email()
          }))).then(items => {
            return _.map(items, item => item.id);
          });
        }
      })
    ],

    'Task': [

      Randomizer.property('bucket', (item, context, randomizer) => randomizer.chance.pickone(context.buckets)),

      // TODO(burdon): Set owner for all types in Randomizer?
      Randomizer.property('owner', (item, context) => context.userId),

      Randomizer.property('labels', (item, context, randomizer) =>
        randomizer.chance.bool({ likelihood: 20 }) ? [LABEL.FAVORITE] : []),

      Randomizer.property('title', (item, context, randomizer) =>
        randomizer.chance.sentence({ words: randomizer.chance.natural({ min: 3, max: 5 }) })),

      Randomizer.property('description', (item, context, randomizer) =>
        randomizer.chance.sentence({ words: randomizer.chance.natural({ min: 10, max: 20 }) })),

      Randomizer.property('status', (item, context, randomizer) => randomizer.chance.natural({
        min: Enum.TASK_LEVEL.UNSTARTED,
        max: Enum.TASK_LEVEL.BLOCKED
      })),

      Randomizer.property('assignee', (item, context, randomizer) => {
        if (randomizer.chance.bool()) {
          return database.getItemStore(Database.NAMESPACE.SYSTEM).getItem(context, 'Group', item.bucket)
            .then(group => {
              console.assert(group);
              return randomizer.chance.pickone(group.members);
            });
        }
      }),

      // TODO(burdon): Do this first and "cache" the group in the context?
      Randomizer.property('project', (item, context, randomizer) => {
        return database.getQueryProcessor(Database.NAMESPACE.USER).queryItems({ buckets: [item.bucket] }, {}, {
          type: 'Project'
        }).then(projects => {
          if (_.isEmpty(projects)) {
            console.warn('No projects for: ' + JSON.stringify(context));
            return null;
          }

          let project = randomizer.chance.pickone(projects);
          return project.id;
        });
      }),

      Randomizer.property('tasks', (item, context, randomizer) => {
        let { userId } = context;
        let num = randomizer.chance.natural({ min: 0, max: 3 });
        if (num) {
          // TODO(burdon): Reuse generator? (but same project).
          return database.getItemStore(Database.NAMESPACE.USER).upsertItems(context, _.times(num, i => ({
            type: 'Task',
            bucket: item.bucket,
            title: randomizer.chance.sentence({ words: randomizer.chance.natural({ min: 3, max: 5 }) }),
            project: item.project,
            owner: userId,
            status: randomizer.chance.bool() ? Enum.TASK_LEVEL.UNSTARTED : Enum.TASK_LEVEL.COMPLETE
          }))).then(items => {
            return _.map(items, item => item.id);
          });
        }
      })
    ],

    'Contact': [

      Randomizer.property('bucket', (item, context, randomizer) => randomizer.chance.pickone(context.buckets)),

      Randomizer.property('title', (item, context, randomizer) => randomizer.chance.name()),

      Randomizer.property('email', (item, context, randomizer) => randomizer.chance.email())
    ]
  });

  /**
   * Link Generators -- generate mutations.
   */
  static Linkers = {

    // Add project to group.
    'Project': (item, context) => {
      return {
        key: ID.key({ type: 'Group', id: item.group }),
        mutations: [
          MutationUtil.createSetMutation('projects', 'key', ID.key(item))
        ]
      };
    },

    // Add task to project.
    'Task': (item, context) => {
      if (item.project) {
        return {
          key: ID.key({ type: 'Project', id: item.project }),
          mutations: [
            MutationUtil.createSetMutation('tasks', 'key', ID.key(item))
          ]
        };
      }
    }
  };

  constructor(database) {
    console.assert(database);
    this._database = database;
    this._randomizer = new Randomizer(TestGenerator.Generators(database), TestGenerator.Linkers);
  }

  /**
   * Generate items for users.
   */
  generate() {
    // Generate for each user.
    return this._database.getQueryProcessor(Database.NAMESPACE.SYSTEM)
      .queryItems({}, {}, { type: 'User' })
      .then(users => {
        return Promise.all(_.map(users, user => {
          let { id:userId } = user;
          console.assert(userId);

          // Lookup by Groups for User.
          // TODO(burdon): Should be enforced by store given context?
          return this._database.getQueryProcessor(Database.NAMESPACE.SYSTEM)
            .queryItems({ userId }, {}, {
              type: 'Group',
              expr: {
                field: 'members',
                ref: '$CONTEXT.userId',
                comp: 'IN'
              }
            }).then(groups => {
              return Promise.all(_.map(groups, group => {
                let context = { userId, buckets: [group.id] };

                //
                // Generate data items for each user.
                //
                return Promise.resolve()
                  // TODO(burdon): Add default label for private project.
                  // TODO(burdon): Auto-provision project when creating a group.

                  // .then(() =>
                  //   this.generateItems(context, 'Project', 1))

                  .then(() =>
                    this.generateItems(context, 'Task', this._randomizer.chance.natural({ min: 10, max: 20 })))

                  .then(() =>
                    this.generateItems(context, 'Contact', this._randomizer.chance.natural({ min: 1, max: 3 })));
              }));
            });
        }));
      });
  }

  generateItems(context, type, count) {
    const getStore = type => {
      switch (type) {
        case 'Group':
          return this._database.getItemStore(Database.NAMESPACE.SYSTEM);

        default:
          return this._database.getItemStore(Database.NAMESPACE.USER);
      }
    };

    // Generate items.
    return this._randomizer.generateItems(context, type, count)
      .then(items => {

        // Upsert items.
        return getStore(type).upsertItems(context, items).then(items => {

          _.each(items, item => {
            logger.log('Test: ' + JSON.stringify(_.pick(item, ['id', 'type', 'title'])));
          });

          // Generate and save links.
          return this._randomizer.generateLinkMutations(context, items).then(itemMutations => {

            // Load and update items.
            return Promise.all(_.each(itemMutations, itemMutation => {
              let { type, id } = itemMutation.key;

              let itemStore = getStore(type);
              return itemStore.getItem(context, type, id).then(item => {
                console.assert(item);

                Transforms.applyObjectMutations({}, item, itemMutation.mutations);
                return itemStore.upsertItem(context, item);
              });
            }));
          });
        });
      });
  }
}
