//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';

import { TypeUtil } from 'alien-util';

import { LABEL } from './defs';

/**
 * Query parser.
 */
export class QueryParser {

  /**
   * Determines if filter is empty (has no effect).
   * @param filter
   * @returns {boolean}
   */
  static isEmpty(filter) {
    console.assert(_.isObject(filter));
    return _.isEmpty(filter.labels) && !filter.type && !filter.text;
  }

  /**
   * Remove blank fields.
   * @param filter
   * @returns {*}
   */
  // TODO(burdon): Move to util.
  static trim(filter) {
    return _.omitBy(filter, (value, key) => _.isEmpty(value));
  }

  /**
   * Parse text query.
   * @param text Plain text from user
   * @returns {filter}
   */
  parse(text) {
    let filter = {
      type: undefined,
      labels: [],
      text: ''
    };

    // TODO(burdon): _.words?
    let words = [];
    _.each(text.split(/\s+/), (str) => {

      // Type.
      if (str[0] === '@') {
        filter.type = str.substring(1);
        return;
      }

      // Labels.
      if (str[0] === '#') {
        let label = str.substring(1);
        switch (label) {
          case 'fav': {
            filter.labels.push(LABEL.FAVORITE);
            break;
          }

          case 'del': {
            filter.labels.push(LABEL.DELETED);
            break;
          }

          default: {
            filter.labels.push(label);
          }
        }
        return;
      }

      // Text
      words.push(str);
    });

    if (words.length) {
      filter.text = words.join(' ');
    }

//  filter.groupBy = true;

    return TypeUtil.compact(filter);
  }
}
