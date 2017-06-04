//
// Copyright 2017 Minder Labs.
//

import React from 'react';
import gql from 'graphql-tag';
import { Link } from 'react-router';

import { ID, MutationUtil } from 'alien-core';
import { Enum, Fragments } from 'alien-api';

import { Card } from '../../../components/card';
import { List } from '../../../components/list';
import { ReactUtil } from '../../../util/react';
import { Path } from '../../../common/path';

import { QueryItem } from '../item_container';

import { MembersPicker } from './members';
import { TaskItemRenderer, TaskItemEditor } from './task';

/**
 * Task card.
 */
export class TaskCard extends React.Component {

  state = {};

  // TODO(burdon): Move state management to MembersPicker.
  componentWillReceiveProps(nextProps) {
    let { item={} } = nextProps;
    let { assignee } = item;

    this.state = {
      assignee: {
        title: _.get(assignee, 'title')
      }
    };
  }

  // TODO(burdon): Tigger mutation.
  handleSetItem(property, item) {
    this.setState({
      [property]: item
    });
  }

  // TODO(burdon): Tigger mutation.
  handleSetStatus(event) {
    this.setState({
      status: event.target.value
    });
  }

  // TODO(burdon): Factor out task list.
  handleTaskUpdate(item, mutations) {
    console.assert(mutations);

    let { viewer: { user }, item:parent, mutator } = this.props;
    console.assert(parent.project);

    if (item) {
      mutator
        .batch(parent.project.bucket)
        .updateItem(item, mutations)
        .commit();
    } else {
      mutator
        .batch(parent.project.bucket)
        .createItem('Task', _.concat(mutations, [
          MutationUtil.createFieldMutation('project', 'key',   ID.key(parent.project)),
          MutationUtil.createFieldMutation('owner',   'key',   ID.key(user)),
          MutationUtil.createFieldMutation('status',  'int',   Enum.TASK_LEVEL.UNSTARTED),
        ]), 'task')
        .updateItem(parent, [
          ({ task }) => MutationUtil.createSetMutation('tasks', 'key', ID.key(task))
        ])
        .commit();
    }
  }

  render() {
    return ReactUtil.render(this, () => {
      let { item:task } = this.props;
      if (!task) {
        return;
      }

      let { assignee, status } = this.state;
      let { project, tasks } = task;

      const levels = _.keys(Enum.TASK_LEVEL.properties).sort().map(level =>
        <option key={ level } value={ level }>{ Enum.TASK_LEVEL.properties[level].title }</option>);

      return (
        <Card item={ task }>

          <Card.Section id="task">
            <div className="ux-card-padding">

              { project &&
              <div className="ux-form-row">
                <label>Project</label>
                <Link to={ Path.canvas(ID.key(project)) }>{ project.title }</Link>
              </div>
              }

              { project && project.group && // TODO(burdon): Invalid group.
              <div className="ux-form-row">
                <label>Assigned</label>
                <MembersPicker value={ _.get(assignee, 'title') }
                               groupId={ project.group.id }
                               onItemSelect={ this.handleSetItem.bind(this, 'assignee') }/>
              </div>
              }

              <div className="ux-form-row">
                <label>Status</label>
                <select value={ status } onChange={ this.handleSetStatus.bind(this) }>
                  { levels }
                </select>
              </div>
            </div>

          </Card.Section>

          <Card.Section id="tasks" title="Tasks">
            <List ref="tasks"
                  className="ux-list-tasks"
                  items={ tasks }
                  itemRenderer={ TaskItemRenderer }
                  itemEditor={ TaskItemEditor }
                  onItemUpdate={ this.handleTaskUpdate.bind(this) }/>
          </Card.Section>

        </Card>
      );
    });
  }
}

const TaskItemQuery = gql`
  query TaskItemQuery($key: KeyInput!) {
    item(key: $key) {
      ...ItemFragment
      ...TaskFragment
      
      ... on Task {
        project {
          group {
            type
            id
          }
        }
      }
    }
  }

  ${Fragments.ItemFragment}  
  ${Fragments.TaskFragment}  
`;

export const TaskCardContainer = QueryItem(TaskItemQuery)(TaskCard);
