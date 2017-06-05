//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';
import gql from 'graphql-tag';

import { TypeUtil } from 'alien-util';

//
// Framework fragments.
//

export const ValueFragment = gql`
  fragment ValueFragment on Value {
    null
    int
    float
    string
    boolean
    id
    timestamp
    date
  }
`;

/**
 * Map of Fragments by type.
 *
 * This map is used by the mutator's batch to apply mutation results (both optimistic and server)
 * to the cache.
 */
export class FragmentsMap {

  static getFragmentName(fragment) {
    console.assert(fragment);
    return _.get(fragment, 'definitions[0].name.value');
  }

  constructor() {
    // Map of array of fragment GQL documents by type.
    this._map = new Map();
  }

  add(fragment) {
    let type = _.get(fragment, 'definitions[0].typeCondition.name.value');
    console.assert(type);
    TypeUtil.defaultMap(this._map, type, Array).push(fragment);
    return this;
  }

  getFragments(type) {
    return this._map.get(type);
  }
}
