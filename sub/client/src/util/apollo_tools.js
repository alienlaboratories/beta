//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';
import { IntrospectionFragmentMatcher } from 'react-apollo';

/**
 * Testing (schema brings in server deps).
 *
 * @param {[{string}]|{Schema}} itemTypes Array of type names, or schema (for testing).
 */
export function createFragmentMatcher(itemTypes) {
  console.assert(itemTypes);

  if (!_.isArray(itemTypes)) {
    itemTypes = _.map(_.get(itemTypes, '_implementations.Item'), i => String(i));
  }

  // http://dev.apollodata.com/react/initialization.html#fragment-matcher
  console.assert(!_.isEmpty(itemTypes));
  return new IntrospectionFragmentMatcher({
    introspectionQueryResultData: {
      __schema: {
        types: [
          {
            kind: 'INTERFACE',
            name: 'Item',
            possibleTypes: _.map(itemTypes, itemType => ({ name: itemType }))
          }
        ]
      }
    }
  });
}
