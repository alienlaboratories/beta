//
// Copyright 2017 Minder Labs.
//

import { Enum } from 'alien-api';
import { MutationUtil } from 'alien-core';

/**
 * Configures the board depending on the current view.
 */
class BoardAdapter {

  get alias() {}

  /**
   * Returns an ordered array of columns.
   * @param project
   * @returns {Array.<{ id, value, title }>} Column specs.
   */
  getColumns(project) {
    return [];
  }

  /**
   * Returns a function that maps items onto a column (ID).
   * @returns {function(*, *)}
   */
  // TODO(burdon): Generalize params (state).
  getColumnMapper() {
    return (columns, item) => null;
  }

  /**
   * Supplies column-specific mutations on create.
   * @param {{ id, value, title }} column
   * @returns {[{Mutation}]} Mutations to add to the created item.
   */
  onCreateItem(column) {
    console.warn('onCreateItem', column);
  }

  /**
   * Supplies column-specific mutations on drop.
   * @param {{ id, value, title }} column
   * @returns {[{Mutation}]} Mutations to add to the created item.
   */
  onDropItem(column) {
    console.warn('onDropItem', column);
  }
}

/**
 * Adapter for project tasks by status.
 */
export class TaskStatusBoardAdapter extends BoardAdapter {

  static ALIAS = 'status';

  static COLUMNS = _.map(Enum.TASK_LEVEL.properties, (def, value) => ({
    id: 'C-' + value,
    title: def.title,
    value: parseInt(value)
  }));

  get alias() {
    return TaskStatusBoardAdapter.ALIAS;
  }

  getColumns() {
    return TaskStatusBoardAdapter.COLUMNS;
  }

  getColumnMapper() {
    return (columns, item) => {
      let { status } = item;
      let idx = _.findIndex(columns, column => column.value === status);
      return (idx !== -1) && columns[idx].id;
    };
  }

  onCreateItem(column) {
    return [
      MutationUtil.createFieldMutation('status', 'int', column.value)
    ];
  }

  onDropItem(column) {
    return [
      MutationUtil.createFieldMutation('status', 'int', column.value)
    ];
  }
}
