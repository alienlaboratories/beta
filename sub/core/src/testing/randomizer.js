//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';
import { Chance } from 'chance';

import { Async, Logger, TypeUtil } from 'alien-util';

import { ID } from '../id';

const logger = Logger.get('randomizer');

/**
 * Randomizer
 */
export class Randomizer {

  /**
   * @param property Named property.
   * @param generator Generator returns a Promise.
   */
  static property(property, generator) {
    return { property, generator };
  }

  /**
   * @param generators
   * @param linkers
   * @param options
   */
  constructor(generators, linkers, options) {
    console.assert(generators && linkers);
    this._generators = generators;
    this._linkers = linkers;
    this._options = _.defaults(options, {
      seed: 1000
    });

    // http://chancejs.com
    this._chance = new Chance(this._options.seed);
  }

  get chance() {
    return this._chance;
  }

  /**
   * Asynchronously generate items of the given type.
   * Optionally provide field plugins that can either directly set values or query for them.
   *
   * @param context
   * @param type
   * @param n
   * @return Promise
   */
  generateItems(context, type, n) {
    logger.log(`GENERATE[${type}]:${n}`);

    return Promise.all(_.times(n, i => {
      // TODO(burdon): Set owner, bucket, etc?
      let item = {
        type
      };

      // Process fields in order (since may be dependent).
      let propertyGenerators = this._generators[type];
      return Async.iterateWithPromises(propertyGenerators, ({ property, generator }) => {
        return Promise.resolve(generator(item, context, this)).then(value => {
          if (!_.isNil(value)) {
            _.set(item, property, value);
          }

          return item;
        });
      });
    }));
  }

  /**
   * Generate link mutations for created items.
   *
   * @param context
   * @param items
   * @returns {*}
   */
  generateLinkMutations(context, items) {
    return Promise.all(_.compact(_.map(items, item => {
      let linker = this._linkers[item.type];
      if (linker) {
        return Promise.resolve(linker(item, context));
      }
    }))).then(itemMutations => {

      // Merge mutations.
      let itemMutationsByKey = new Map();
      _.each(_.compact(itemMutations), itemMutation => {
        let { key, mutations } = itemMutation;
        let keyStr = ID.keyToString(key);

        let itemMutations = itemMutationsByKey.get(keyStr);
        if (itemMutations) {
          TypeUtil.maybeAppend(itemMutations.mutations, mutations);
        } else {
          itemMutationsByKey.set(keyStr, itemMutation);
        }
      });

      return Array.from(itemMutationsByKey.values());
    });
  }
}
