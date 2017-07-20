//
// Copyright 2017 Alien Labs.
//

import { Enum } from 'alien-api';
import { MutationUtil } from 'alien-core';
import { TypeUtil } from 'alien-util';

/**
 * Configures the board depending on the current view.
 */
class BoardAdapter {

  get alias() {}

  get icon() {}

  get title() {}

  get editable() {
    return false;
  }

  getItems(project, board) {}

  /**
   * Returns an ordered array of columns.
   * @param project
   * @param board
   * @returns {Array.<{ id, value, title }>} Column specs.
   */
  getColumns(project, board) {
    return [];
  }

  /**
   * Returns a function that maps items onto a column (ID).
   * @returns {function(*, *)}
   */
  getColumnMapper(project, board) {
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

  static ALIAS = '_status';

  static COLUMNS = _.map(Enum.TASK_LEVEL.properties, (def, value) => ({
    id: 'C-' + value,
    title: def.title,
    value: parseInt(value)
  }));

  get alias() {
    return TaskStatusBoardAdapter.ALIAS;
  }

  get icon() {
    return 'check';
  }

  get title() {
    return 'Task status.';
  }

  getItems(project, board) {
    return project.tasks;
  }

  getColumns(project, board) {
    return TaskStatusBoardAdapter.COLUMNS;
  }

  getColumnMapper(project, board) {
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

/**
 * Adapter for project tasks by status.
 */
export class TaskAssigneeBoardAdapter extends BoardAdapter {

  static ALIAS = '_assignee';

  static UNASSINGED = '_UNASSIGNED_';

  get alias() {
    return TaskAssigneeBoardAdapter.ALIAS;
  }

  get icon() {
    return 'supervisor_account';
  }

  get title() {
    return 'Task assignment.';
  }

  getItems(project, board) {
    return project.tasks;
  }

  // TODO(burdon): Sort by number of assigned tasks.
  getColumns(project, board) {
    return _.concat({
      id:     TaskAssigneeBoardAdapter.UNASSINGED,
      value:  TaskAssigneeBoardAdapter.UNASSINGED,
      title:  'Unassigned'
    }, _.map(_.get(project, 'group.members'), member => ({
      id:     member.id,
      value:  member.id,
      title:  member.title
    })));
  }

  getColumnMapper(project, board) {
    return (columns, item) => {
      let column = _.find(columns, column => column.value === _.get(item, 'assignee.id'));
      return column ? column.value : TaskAssigneeBoardAdapter.UNASSINGED;
    };
  }

  onCreateItem(column) {
    return column.value === TaskAssigneeBoardAdapter.UNASSINGED ? []: [
      MutationUtil.createFieldMutation('assignee', 'key', { type: 'User', id: column.value })
    ];
  }

  onDropItem(column) {
    return column.value === TaskAssigneeBoardAdapter.UNASSINGED ? [
      MutationUtil.createFieldMutation('assignee')
    ] : [
      MutationUtil.createFieldMutation('assignee', 'key', { type: 'User', id: column.value })
    ];
  }
}

/**
 * Adapter for items that are defined by the board query (filter).
 */
export class QueryBoardAdapter extends BoardAdapter {

  // TODO(burdon): Prevent Add card in custom boards.

  constructor(board) {
    super();
    console.assert(board);
    this._board = TypeUtil.compact(board);
  }

  get alias() {
    return _.get(this._board, 'alias');
  }

  get icon() {
    return _.get(this._board, 'icon', 'view_week');
  }

  get title() {
    return _.get(this._board, 'title', 'Custom board.');
  }

  get editable() {
    return true;
  }

  getColumns(project, board) {
    return _.get(this._board, 'columns', []);
  }

  // TODO(burdon): Either update mutation (cache) or pass in cached values from board.
  getColumnMapper(project, board) {
    return (columns, item) => {
      let meta = _.find(board.itemMeta, meta => meta.itemId === item.id);
      return meta ? meta.listId : columns[0].id;
    };
  }

  onDropItem(column) {}
}
