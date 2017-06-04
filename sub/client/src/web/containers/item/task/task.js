//
// Copyright 2017 Minder Labs.
//

import React from 'react';

import { Enum } from 'alien-api';
import { MutationUtil } from 'alien-core';

import { ListItem } from '../../../components/list';

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

/**
 * Renders task title and status checkbox.
 */
export const TaskItemRenderer = (item) => {
  return (
    <ListItem item={ item }>
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
