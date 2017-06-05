//
// Copyright 2017 Minder Labs.
//

import React from 'react';
import PropTypes from 'prop-types';
import gql from 'graphql-tag';
import { Link } from 'react-router';

import { ID } from 'alien-core';
import { Enum, Fragments } from 'alien-api';

import { Card } from '../../../components/card';
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

export const TaskCardContainer = QueryItem(TaskItemQuery)(TaskCard);
