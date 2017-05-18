//
// Copyright 2017 Alien Labs.
//

import { Logger, TypeUtil } from 'alien-util';
import { IdGenerator, ItemStore, Matcher, MemoryItemStore } from 'alien-core';

import { UpsertItemsMutationName, ProjectsQueryName } from './common';

const logger = Logger.get('testing');

//-------------------------------------------------------------------------------------------------
// Test Server.
//-------------------------------------------------------------------------------------------------

// TODO(burdon): Use actual mock server with existing resolvrer (extend current api tests).
// import { mockServer } from 'graphql-tools';

const bucket = 'Group-1';

const context = { buckets: [ bucket ] };

/**
 * Test NetworkInterface
 */
export class TestingNetworkInterface {

  static NETWORK_DELAY = 2000;

  count = 0;

  /**
   * @param stateGetter Get Redux store state.
   */
  constructor(stateGetter) {
    console.assert(stateGetter);
    this._stateGetter = stateGetter;
    this._itemStore = new MemoryItemStore(new IdGenerator(), new Matcher(), 'testing', true);
  }

  init() {
    // TODO(burdon): Test data.
    return this._itemStore.upsertItems(context, [
      {
        bucket,
        id: 'T-1',
        type: 'Task',
        title: 'Task 1',
      },
      {
        bucket,
        id: 'T-2',
        type: 'Task',
        title: 'Task 2',
      },
      {
        bucket,
        id: 'T-3',
        type: 'Task',
        title: 'Task 3',
      },
      {
        bucket,
        id: 'P-1',
        type: 'Project',
        title: 'Default Project',
        labels: ['_default'],

        group: {
          __typename: 'Group',

          id: bucket,
          title: 'Default Group'
        },

        tasks: ['T-1', 'T-2', 'T-3']
      }
    ]);
  }

  //
  // NetworkInterface
  //

  query({ operationName, query, variables }) {
    let { options } = this._stateGetter();
    let delay = options.networkDelay ? TestingNetworkInterface.NETWORK_DELAY : 0;

    let count = ++this.count;
    logger.info(`REQ[${operationName}:${count}]`, TypeUtil.stringify(variables));
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        Promise.resolve(this.processQuery(operationName, query, variables))

          .then(response => {
            logger.info(`RES[${operationName}:${count}]`, TypeUtil.stringify(response));
            resolve(response);
          })

          .catch(error => {
            reject({
              errors: [{ message: 'TestingNetworkInterface Error: ' + String(error) }],
            });
          });
      }, delay);
    });
  }

  processQuery(operationName, query, variables) {

    // Resolve vector of IDs to objects.
    const resolveItems = (item, type, field) => {
      let filter = { ids: item[field] };
      return this._itemStore.queryItems(context, {}, filter).then(items => {
        item[field] = _.map(items, item => _.defaults(item, { __typename: type }));
        return item;
      });
    };

    switch (operationName) {

      //
      // ProjectsQuery
      //
      case ProjectsQueryName: {
        let { filter } = variables;

        return this._itemStore.queryItems(context, {}, filter).then(items => {
          return Promise.all(_.map(items, item => {
            item.__typename = item.type;
            return resolveItems(item, 'Task', 'tasks');
          }));
        }).then(items => {
          return {
            data: {
              search: {
                __typename: 'SeachResult',
                items
              }
            }
          };
        });
      }

      //
      // UpsertItemsMutation
      //
      case UpsertItemsMutationName: {
        let { mutations } = variables;

        return ItemStore.applyMutations(this._itemStore, context, mutations).then(upsertItems => {
          return Promise.all(_.map(upsertItems, upsertItem => {
            upsertItem.__typename = upsertItem.type;

            upsertItem.labels = upsertItem.labels || [];

            // Mini-resolver.
            switch (upsertItem.type) {
              case 'Project':
                return resolveItems(_.cloneDeep(upsertItem), 'Task', 'tasks');

              default:
                return Promise.resolve(upsertItem);
            }
          }));
        }).then(upsertItems => {
          return {
            data: {
              // status: 200
              upsertItems
            }
          };
        });
      }

      default: {
        return Promise.reject('Invalid operation: ' + operationName);
      }
    }
  }
}
