//
// Copyright 2017 Alien Labs.
//

/**
 * Standard tests for all ItemStore implementations
 *
 * @param storeFactory
 * @param buckets
 */
export const ItemStoreTests = (storeFactory, buckets=true) => {

  test('Stores and retrieves items.', () => {
    return storeFactory().then(itemStore => {
      let context = {
        buckets: buckets ? ['test-bucket']: []
      };

      let root = {};

      const createItem = (bucket, type, title) => {
        let item = {
          type, title
        };

        if (bucket) {
          item.bucket = bucket;
        }

        return item;
      };

      let items = [
        createItem(buckets && 'test-bucket', 'Task', 'Task-1'),
        createItem(buckets && 'test-bucket', 'Task', 'Task-2'),
        createItem(buckets && 'test-bucket', 'Task', 'Task-3')
      ];

      // Write items.
      return itemStore.upsertItems(context, items)

        //
        // Look-up by filter.
        //
        .then(upsertedItems => {
          expect(upsertedItems).toHaveLength(items.length);
          let filter = {
            type: 'Task'
          };

          return itemStore.queryItems(context, root, filter).then(matchedItems => {
            // expect(matchedItems).toHaveLength(upsertedItems.length);
            // return upsertedItems;
          });
        });

        //
        // Look-up by ID.
        //
        // .then(upsertedItems => {
        //   expect(upsertedItems).toHaveLength(items.length);
        //   let itemIds = _.map(upsertedItems, item => item.id);
        //
        //   return itemStore.getItems(context, 'Task', itemIds).then(matchedItems => {
        //     expect(matchedItems).toHaveLength(items.length);
        //     return upsertedItems;
        //   });
        // })

        //
        // Test.
        //
        // .then(upsertedItems => {
        //   expect(upsertedItems).toHaveLength(items.length);
        //   done();
        // });
    });
  });
};
