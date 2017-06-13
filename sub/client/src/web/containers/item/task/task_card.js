//
// Copyright 2017 Minder Labs.
//

import React from 'react';
import PropTypes from 'prop-types';
import gql from 'graphql-tag';
import { Link } from 'react-router';

import { ID, MutationUtil } from 'alien-core';
import { Enum, Fragments } from 'alien-api';

import { Card, CardCanvas } from '../../../components/card';
import { ReactUtil } from '../../../util/react';
import { Path } from '../../../common/path';

import { QueryItem } from '../item_container';

import { MembersPicker } from './members';
import { TaskList } from './task_list';

/**
 * Task card.
 */
export class TaskCard extends React.Component {

  static propTypes = {
    mutator:    PropTypes.object.isRequired,
    viewer:     PropTypes.object.isRequired
  };

  state = {};

  constructor() {
    super(...arguments);

    this.state = this.getState(this.props);
  }

  componentWillReceiveProps(nextProps) {
    this.setState(this.getState(nextProps));
  }

  getState(props) {
    let { item:task={} } = props;
    let { status } = task;

    return {
      status,

       // TODO(burdon): Move state management to MembersPicker.
      assignee: _.get(task, 'assignee')
    };
  }

  handleSetReference(field, item) {
    let { mutator, viewer: { groups }, item:task } = this.props;

    let key = item && ID.key(item);

    let batch = mutator
      .batch(groups, task.bucket)
      .updateItem(task, [
        MutationUtil.createFieldMutation(field, 'key', key)
      ])
      .commit();

    // TODO(burdon): External re-render triggered (can't set state on unmounted component).
    batch.then(() => {
      this.setState({
        [field]: item
      });
    });
  }

  handleSetStatus(event) {
    let { mutator, viewer: { groups }, item:task } = this.props;

    let status = event.target.value;

    let batch = mutator
      .batch(groups, task.bucket)
      .updateItem(task, [
        MutationUtil.createFieldMutation('status', 'int', parseInt(status))
      ])
      .commit();

    // TODO(burdon): External re-render triggered (can't set state on unmounted component).
    batch.then(() => {
      this.setState({
        status
      });
    });
  }

  render() {
    return ReactUtil.render(this, () => {
      let { mutator, viewer, item:task } = this.props;
      if (!task) {
        return;
      }

      let { assignee, status } = this.state;
      let { project, tasks } = task;

      const levels = _.keys(Enum.TASK_LEVEL.properties).sort().map(level =>
        <option key={ level } value={ level }>{ Enum.TASK_LEVEL.properties[level].title }</option>);

      return (
        <Card mutator={ mutator } viewer={ viewer } item={ task }>

          <Card.Section id="task" title="Details">
            <div className="ux-card-padding">

              <div className="ux-form-row">
                <label>Status</label>
                <select value={ status } onChange={ this.handleSetStatus.bind(this) }>
                  { levels }
                </select>
              </div>

              { project && project.group &&
              <div className="ux-form-row">
                <label>Assigned</label>
                <MembersPicker value={ _.get(assignee, 'title') }
                               groupId={ project.group.id }
                               onItemSelect={ this.handleSetReference.bind(this, 'assignee') }/>
              </div>
              }

              { project &&
              <div className="ux-form-row">
                <label>Project</label>
                <Link to={ Path.canvas(ID.key(project)) }>{ project.title }</Link>
              </div>
              }

            </div>
          </Card.Section>

          <Card.Section id="tasks" title="Tasks">
            <TaskList mutator={ mutator } viewer={ viewer } parent={ task } project={ task.project } tasks={ tasks }/>
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

export const TaskCardContainer = QueryItem(TaskItemQuery)(CardCanvas(TaskCard));
