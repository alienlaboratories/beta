//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';

import { TypeUtil } from 'alien-util';

import { Transforms } from './transforms';
import { ItemUtil } from './item_util';

/**
 * Abstract base class.
 *
 * NOTE: QueryProcessor is separate from ItemStore since may be implemented by different server (e.g., ElasticSearch).
 */
export class QueryProcessor {

  // TODO(burdon): Remove.
  static DEFAULT_COUNT = 20;

  /**
   * @param namespace Namespace in filter and get/set operations routes to the specified QueryProcessor/ItemStore.
   */
  constructor(namespace) {
    console.assert(_.isString(namespace), 'Invalid namespace: ' + namespace);
    this._namespace = namespace;
  }

  get namespace() {
    return this._namespace;
  }

  /**
   *
   * @param context
   * @param root
   * @param filter
   * @return {Promise<[Item]>} Retrieved items or [].
   */
  // TODO(burdon): Document root (see Matcher.matchComparatorExpression and ExpressionInput).
  queryItems(context, root={}, filter={}) {
    throw new Error('Not implemented');
  }
}

/**
 * Abstract base class.
 */
export class ItemStore extends QueryProcessor {

  // TODO(burdon): Don't extend QueryProcessor.
  // TODO(burdon): Implement basic Keyscan lookup (e.g., Type-only) and replace current getItems().

  /**
   * @param namespace Namespace.
   * @param buckets If true, then checks items have buckets.
   */
  constructor(namespace, buckets=false) {
    super(namespace);
    this._buckets = buckets;
  }

  dump() {
    return Promise.resolve({ info: this.toString() });
  }

  /**
   *
   * @param context
   * @param type
   * @param id
   * @return {Promise<Item>} Item or null.
   */
  // TODO(burdon): Key.
  getItem(context, type, id) {
    console.assert(type && id, 'Invalid ID: ' + id);
    return this.getItems(context, type, [id]).then(items => items[0]);
  }

  /**
   *
   * @param context
   * @param item
   * @return {Promise<Item>} Updated item.
   */
  upsertItem(context, item) {
    return this.upsertItems(context, [item]).then(items => items[0]);
  }

  /**
   *
   * @param context
   * @param type
   * @param id
   */
  deleteItem(context, type, id) {
    return this.deleteItems(context, type, [id]).then(items => items[0]);
  }

  /**
   *
   * @param context
   * @param type
   * @param itemIds
   * @return {Promise<[Item]>} Retrieved items or [].
   */
  // TODO(burdon): Keys.
  getItems(context, type, itemIds=[]) {
    throw new Error('Not implemented');
  }

  /**
   *
   * @param context
   * @param items
   * @return {Promise<[Item]>} Updated items.
   */
  upsertItems(context, items) {
    throw new Error('Not implemented');
  }

  /**
   *
   * @param context
   * @param type
   * @param itemIds
   */
  deleteItems(context, type, itemIds) {
    throw new Error('Not implemented');
  }

  /**
   * Processes the item mutations, creating and updating items.
   *
   * @param itemStore
   * @param context
   * @param itemMutations
   * @return {Promise<[Item]>}
   */
  static applyMutations(itemStore, context, itemMutations) {
    console.assert(itemStore && context && itemMutations);

    // TODO(burdon): Get items in batch.
    return Promise.all(_.map(itemMutations, itemMutation => {
      let { key, mutations } = itemMutation;
      let { bucket, type, id } = key;

      //
      // Get and update item.
      // TODO(burdon): Relies on getItem to return {} for not found.
      //
      return itemStore.getItem(context, type, id).then(item => {

        // If not found (i.e., insert).
        // TODO(burdon): Check this is an insert (not a miss due to a bug); use version?
        if (!item) {
          item = {
            bucket,
            type,
            id
          };
        }

        //
        // Apply mutations.
        //
        return Transforms.applyObjectMutations({}, item, mutations);
      });
    }))

      //
      // Upsert items.
      //
      .then(results => {
        let items = _.flatten(results);
        return itemStore.upsertItems(context, items);
      });
  }
}

/**
 * Wraps another ItemStore.
 */
export class DelegateItemStore extends ItemStore {

  constructor(itemStore) {
    super(itemStore.namespace);
    this._itemStore = itemStore;
  }

  queryItems(context, root={}, filter={}) {
    return this._itemStore.queryItems(context, root, filter);
  }

  getItems(context, type, itemIds=[]) {
    return this._itemStore.getItems(context, type, itemIds);
  }

  upsertItems(context, items) {
    return this._itemStore.upsertItems(context, items);
  }
}

/**
 * Base ItemStore.
 */
export class BaseItemStore extends ItemStore {

  constructor(idGenerator, matcher, namespace, buckets) {
    super(namespace, buckets);
    console.assert(idGenerator && matcher);
    this._idGenerator = idGenerator;
    this._matcher = matcher;
  }

  /**
   * Update the timestamps and set ID if create.
   * @param item
   * @return {*}
   */
  onUpdate(item) {
    console.assert(item && item.type, 'Invalid item: ' + TypeUtil.stringify(item));

    // Client created items set the ID.
    if (!item.id) {
      item.id = this._idGenerator.createId();
    }

    // Standard metadata.
    let ts = _.now();
    _.defaults(item, {
      created: ts,
      modified: ts
    });

    return item;
  }

  /**
   * Filter and sort list of items.
   *
   * @param itemIterator
   * @param context
   * @param root
   * @param filter
   * @returns {Array}
   */
  // TODO(burdon): Rename filter and sort.
  filterItems(itemIterator, context, root={}, filter={}) {
    let items = [];

    // Match items.
    itemIterator.forEach(item => {
      if (this._matcher.matchItem(context, root, filter, item)) {
        items.push(item);
      }
    });

    // Sort.
    items = ItemUtil.sortItems(items, filter);

    // Page.
    let { offset=0, count=ItemStore.DEFAULT_COUNT } = filter;
    items = _.slice(items, offset, offset + count);

    return items;
  }
}
