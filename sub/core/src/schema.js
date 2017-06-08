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

  constructor() {
    // Map of array of fragment GQL documents by type.
    this._map = new Map();
  }

  add(fragment) {
    let type = FragmentParser.getFragmentTypeName(fragment);
    TypeUtil.defaultMap(this._map, type, Array).push(fragment);
    return this;
  }

  getFragments(type) {
    return this._map.get(type);
  }
}

/**
 * GQL Document structure.
 *
 * definitions[]
 *   typeCondition.name.value
 *   selectionSet
 *     selections[]
 *       typeCondition.name.value
 *       selectionSet
 */
export class FragmentParser {

  static getFragmentName(fragment) {
    console.assert(fragment);
    return _.get(fragment, 'definitions[0].name.value');
  }

  static getFragmentTypeName(fragment) {
    console.assert(fragment);
    return _.get(fragment, 'definitions[0].typeCondition.name.value');
  }

  constructor(fragment) {
    console.assert(fragment);
    this._defaultDefinition = fragment.definitions[0];

    this._definitionMap = new Map();

    _.each(fragment.definitions, definition => {
      this._definitionMap.set(definition.name.value, definition);
    });
  }

  getDefaultObject(value={}) {
    return this._getDefaultsForDefinition(value, this._defaultDefinition);
  }

  _getDefaultsForDefinition(object, definition) {
    console.assert(definition.typeCondition.name.value);
    _.defaults(object, {
      __typename: definition.typeCondition.name.value
    });

    return this._getDefaultsForSelectionSet(object, definition.selectionSet);
  }

  _getDefaultsForSelectionSet(object, selectionSet) {
    if (!selectionSet) {
      return object;
    }

    _.each(selectionSet.selections, selection => {
      switch (selection.kind) {

        case 'Field': {
          let value = _.get(object, selection.name.value, null);

          if (value !== null && selection.selectionSet) {
            let selections = selection.selectionSet.selections;
            console.assert(selections.length === 1);
            let fieldSelection = selections[0];

            //
            // Expand defs if the field is present.
            //
            if (_.isObject(value)) {

              //
              // Handle inline fragment definitions.
              //
              let typename = _.get(fieldSelection, 'typeCondition.name.value');
              if (typename) {
                _.defaults(value, {
                  __typename: typename
                });

                this._getDefaultsForSelectionSet(value, fieldSelection.selectionSet);
              } else {

                //
                // Handle fragment references.
                //
                let fragment = this._definitionMap.get(fieldSelection.name.value);
                let typename = _.get(fragment, 'typeCondition.name.value');
                _.defaults(value, {
                  __typename: typename
                });

                this._getDefaultsForSelectionSet(value, fragment.selectionSet);
              }
            }
          }

          _.set(object, selection.name.value, value);
          break;
        }

        case 'FragmentSpread': {
          let definition = this._definitionMap.get(selection.name.value);
          console.assert(definition, 'Unknown fragment: ' + selection.name.value);
          this._getDefaultsForSelectionSet(object, definition.selectionSet);
          break;
        }

//      case 'InlineFragment': {}

        default: {
          throw new Error('Unexpected kind: ', selection.kind);
        }
      }
    });

    return object;
  }
}
