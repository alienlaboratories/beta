//
// Copyright 2017 Alien Labs.
//

import { TypeUtil } from 'alien-util';
import { ItemUtil, Transforms } from 'alien-core';

import { TestMutationName, TestQueryName } from './common';

export const ID = type => type + '/' + _.uniqueId('I-');

//-------------------------------------------------------------------------------------------------
// Test Server.
//-------------------------------------------------------------------------------------------------

const ITEMS = _.times(5, i => ({
  type: 'Task',
  id: ID('Task'),
  title: 'Task ' + (i + 1)
}));

class Database {

  queryItems() {
    return Promise.resolve(ITEMS);
  }

  upsertItems(items) {
    let itemMap = ItemUtil.createItemMap(ITEMS);
    _.each(items, item => {
      let existing = itemMap.get(item.id);
      if (existing) {
        _.merge(item, existing);
      } else {
        ITEMS.push(item);
      }

      console.log('Database.upsertItems[' + item.id + '] = ' + JSON.stringify(item));
    });

    return Promise.resolve(items);
  }
}

/**
 * Test NetworkInterface
 */
export class TestingNetworkInterface {

  // TODO(burdon): Mocks.
  // import { mockServer } from 'graphql-tools';\

  static NETWORK_DELAY = 2000;

  database = new Database();

  count = 0;

  /**
   * @param stateGetter Get Redux store state.
   */
  constructor(stateGetter) {
    console.assert(stateGetter);
    this.stateGetter = stateGetter;
  }

  //
  // NetworkInterface
  //

  query({ operationName, query, variables }) {
    let { options } = this.stateGetter();
    let delay = options.networkDelay ? TestingNetworkInterface.NETWORK_DELAY : 0;

    let count = ++this.count;
    console.info(`REQ[${operationName}:${count}]`, TypeUtil.stringify(variables));
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        this.processQuery(operationName, query, variables)

          .then(response => {
            console.info(`RES[${operationName}:${count}]`, TypeUtil.stringify(response));
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
    switch (operationName) {

      //
      // Query
      //
      case TestQueryName: {
        return this.database.queryItems().then(items => {
          return {
            data: {
              search: {
                __typename: 'SearchResult', // NOTE: Must be present in result.

                items: _.map(items, item => ({
                  __typename: item.type,
                  ...item
                }))
              }
            }
          };
        });
      }

      //
      // Mutation
      //
      case TestMutationName: {
        return this.database.queryItems().then(items => {
          let { mutations } = variables;

          let upsertItems = [];

          let itemMap = ItemUtil.createItemMap(items);
          _.each(mutations, mutation => {
            let { itemId } = mutation;
            let item = itemMap.get(itemId);
            if (!item) {
              item = {
                type: itemId.substring(0, itemId.indexOf('/')),
                id: itemId
              };
            }

            let upsertItem = Transforms.applyObjectMutations(item, mutation.mutations);

            // Important for client-side cache-normalization.
            _.assign(upsertItem, {
              __typename: item.type
            });

            console.log('Upsert Item: ' + JSON.stringify(upsertItem));
            upsertItems.push(upsertItem);
          });

          return this.database.upsertItems(upsertItems).then(items => {
            return {
              data: {
                upsertItems: items
              }
            };
          });
        });
      }

      default: {
        return Promise.reject('Invalid operation: ' + operationName);
      }
    }
  }
}
