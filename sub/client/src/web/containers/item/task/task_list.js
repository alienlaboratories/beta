//
// Copyright 2017 Minder Labs.
//

import React from 'react';
import PropTypes from 'prop-types';

import { Enum } from 'alien-api';
import { ID, MutationUtil } from 'alien-core';

import { List, ListItem, ListItemEditor } from '../../../components/list';

/**
 * Status checkbox.
 */
const TaskStatus = ListItem.createInlineComponent((props, context) => {
  let { item } = context;

  // TODO(burdon): Generalize status (mapping to board column model).
  // TODO(burdon): Implement icon via className.
  let icon = (item.status === Enum.TASK_LEVEL.COMPLETE) ? 'done' : 'check_box_outline_blank';
  const toggleStatus = () => {
    let status = (item.status === Enum.TASK_LEVEL.UNSTARTED) ? Enum.TASK_LEVEL.COMPLETE : Enum.TASK_LEVEL.UNSTARTED;
    context.onItemUpdate(item, [
      MutationUtil.createFieldMutation('status', 'int', status)
    ]);
  };

  return (
    <i className="ux-icon ux-icon-checkbox" onClick={ toggleStatus }>{ icon }</i>
  );
});

// TODO(burdon): Delete task.

/**
 * Renders task title and status checkbox.
 */
export const TaskItemRenderer = (item) => {
  return (
    <ListItem item={ item } className="ux-form-row">
      <TaskStatus/>
      <ListItem.Text value={ item.title }/>
      <ListItem.EditButton/>
    </ListItem>
  );
};

/**
 * Renders task editor.
 */
export const TaskItemEditor = (item) => {
  return (
    <ListItemEditor item={ item }>
      <ListItem.Icon icon="check_box_outline_blank"/>
      <ListItem.Edit field="title"/>
      <ListItem.EditorButtons/>
    </ListItemEditor>
  );
};

/**
 * Task list.
 */
export class TaskList extends React.Component {

  // TODO(burdon): Hanging editor.

  static propTypes = {
    mutator:    PropTypes.object.isRequired,
    viewer:     PropTypes.object.isRequired,
    parent:     PropTypes.object.isRequired,
    project:    PropTypes.object.isRequired,
    tasks:      PropTypes.array.isRequired
  };

  handleTaskUpdate(item, mutations) {
    let { mutator, viewer: { user }, parent, project } = this.props;
    console.assert(mutations && user && parent && project);

    if (item) {
      mutator
        .batch(project.bucket)
        .updateItem(item, mutations)
        .commit();

    } else {
      mutator
        .batch(project.bucket)
        .createItem('Task', _.concat(mutations, [
          MutationUtil.createFieldMutation('project', 'key',   ID.key(project)),
          MutationUtil.createFieldMutation('owner',   'key',   ID.key(user)),
          MutationUtil.createFieldMutation('status',  'int',   Enum.TASK_LEVEL.UNSTARTED)
        ]), 'task')
        .updateItem(parent, [
          ({ task }) => MutationUtil.createSetMutation('tasks', 'key', ID.key(task))
        ])
        .commit();
    }
  }

  render() {
    let { tasks } = this.props;

    return (
      <List ref="tasks"
            className="ux-list-tasks"
            showEditor={ true }
            items={ tasks }
            itemRenderer={ TaskItemRenderer }
            itemEditor={ TaskItemEditor }
            onItemUpdate={ this.handleTaskUpdate.bind(this) }/>
    );
  }
}
