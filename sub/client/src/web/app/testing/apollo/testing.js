//
// Copyright 2017 Alien Labs.
//

import { TypeUtil } from 'alien-util';
import { IdGenerator, ItemStore, Matcher, MemoryItemStore } from 'alien-core';

import { UpsertItemsMutationName, ProjectsQueryName } from './common';

//-------------------------------------------------------------------------------------------------
// Test Server.
//-------------------------------------------------------------------------------------------------

const bucket = 'Group-0';

/**
 * Test NetworkInterface
 */
export class TestingNetworkInterface {

  // TODO(burdon): Mocks.
  // import { mockServer } from 'graphql-tools';\

  static NETWORK_DELAY = 2000;

  count = 0;

  /**
   * @param stateGetter Get Redux store state.
   */
  constructor(stateGetter) {
    console.assert(stateGetter);
    this._stateGetter = stateGetter;
    this._itemStore = new MemoryItemStore(new IdGenerator(), new Matcher(), 'testing', false);
  }

  init() {
    // TODO(burdon): Test data.
    return this._itemStore.upsertItem({}, {
      __typename: 'Project',

      id: 'P-0',
      bucket,
      type: 'Project',
      title: 'Default Project',
      labels: ['_default'],

      group: {
        __typename: 'Group',

        id: bucket,
        title: 'Default Group'
      }
    });
  }

  //
  // NetworkInterface
  //

  query({ operationName, query, variables }) {
    let { options } = this._stateGetter();
    let delay = options.networkDelay ? TestingNetworkInterface.NETWORK_DELAY : 0;

    let count = ++this.count;
    console.info(`REQ[${operationName}:${count}]`, TypeUtil.stringify(variables));
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        Promise.resolve(this.processQuery(operationName, query, variables))

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
    let context = { buckets: [bucket] };

    switch (operationName) {

      //
      // ProjectsQuery (hard coded).
      //
      case ProjectsQueryName: {
        let { filter } = variables;
        return this._itemStore.queryItems(context, {}, filter).then(items => {

          // For each 'Project' get list of task IDs and query for that.
          return Promise.all(_.map(items, item => {

            // TODO(burdon): Implement mini resolver here (i.e., query for items with ID stored in project).
            return this._itemStore.queryItems(context, {}, { ids: item.tasks }).then(tasks => {
              item.tasks = _.map(tasks, task => _.defaults(task, {
                __typename: task.type
              }));

              return item;
            });
          }));
        }).then(items => {
          return {
            data: {
              search: {
                __typename: 'SeachResult',
                items: items
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

        // TODO(burdon): Check applies mutation to existing record. Global/localID?
        console.log('###', mutations);

        return ItemStore.applyMutations(this._itemStore, context, mutations).then(upsertItems => {

          // TODO(burdon):
          _.each(upsertItems, item => {
            _.assign(item, {
              __typename: item.type
            });
          });

          console.log('####', upsertItems);

          return {
            data: {
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
