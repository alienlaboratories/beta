//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';

import { TypeUtil } from 'alien-util';

/**
 * Map of Fragments by type.
 */
export class FragmentsMap {

  static getFragmentName(fragment) {
    console.assert(fragment);
    return _.get(fragment, 'definitions[0].name.value');
  }

  constructor() {
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
