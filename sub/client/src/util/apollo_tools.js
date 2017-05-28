//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';
import { IntrospectionFragmentMatcher } from 'react-apollo';

import { ITEM_TYPES } from 'alien-core';

/**
 * Testing (schema brings in server deps).
 * @param schema
 */
export function createFragmentMatcher(schema=undefined) {

  // NOTE: List Item types from schema.
  const possibleTypes = schema ? _.map(_.get(schema, '_implementations.Item')) : ITEM_TYPES;

  // http://dev.apollodata.com/react/initialization.html#fragment-matcher
  return new IntrospectionFragmentMatcher({
    introspectionQueryResultData: {
      __schema: {
        types: [
          {
            kind: 'INTERFACE',
            name: 'Item',
            possibleTypes
          }
        ]
      }
    }
  });
}
