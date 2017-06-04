//
// Copyright 2017 Alien Labs.
//

/**
 * The type registry provides definitions and factories for typed components.
 */
export class TypeRegistry {

  /**
   * System singleton.
   *
   * @param {[{string:{ icon, column, card, container }}]} types Map of type specs.
   */
  constructor(types={}) {
    console.assert(types);
    this._types = types;
  }

  /**
   * Icon type.
   *
   * @param {string} type
   * @returns {string} material-icons name.
   */
  icon(type) {
    console.assert(type);
    return _.get(this._types, `${type}.icon`);
  }

  /**
   * Custom list column for list view.
   *
   * @param {string} type
   * @returns {class}
   */
  column(type) {
    console.assert(type);
    return _.get(this._types, `${type}.column`);
  }

  /**
   * Type-specific cards may be rendered inline (in lists) or in the detail view.
   * Since they may have different HOC containers (and therefore, queries), they must implement
   * graceful degredation of the full fields available to the type.
   *
   * @param {string} type
   * @returns {class} Card component.
   */
  card(type) {
    console.assert(type);
    return _.get(this._types, `${type}.card`, _.get(this._types, 'Item'));
  }

  /**
   * Containers call the graphql item query and require the item's key.
   *
   * @param {string} type
   * @returns {class} Canvas container.
   */
  container(type) {
    console.assert(type);
    return _.get(this._types, `${type}.container`);
  }
}
