//
// Copyright 2017 Alien Labs.
//

import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'react-apollo';
import gql from 'graphql-tag';

import { Fragments, MutationUtil } from 'alien-core';

import { ReactUtil } from '../../util/react';

import { Canvas } from '../../components/canvas';
import { Card } from '../../components/card';
import { List } from '../../components/list';

import { Connector } from '../connector';

import { TaskItemEditor, TaskItemRenderer } from './task';

import './contact.less';

//-------------------------------------------------------------------------------------------------
// Components.
//-------------------------------------------------------------------------------------------------

/**
 * Card.
 */
export class ContactCard extends React.Component {

  // TODO(burdon): This is a very specialized ContactCard. Factor out sections.

  static contextTypes = {
    config: PropTypes.object.isRequired,
    mutator: PropTypes.object.isRequired,
    viewer: PropTypes.object.isRequired,
  };

  static propTypes = {
    item: PropTypes.object.isRequired
  };

  static getProjectFromGroupsByLabel(groups, label) {
    return _.chain(groups)
      .map(group => _.get(group, 'projects'))
      .flatten()
      .find(project => _.indexOf(project.labels, label) !== -1)
      .value();
  }

  handleTaskAdd(ref) {
    this.refs[ref].addItem();
  }

  /**
   * Create/update task.
   *
   * @param {Item} item Item to update.
   * @param {[Mutation]} mutations
   * @param {Project} project Project that owns this item.
   * @param {User} assignee User object, if not null new tasks are assigned to this User.
   */
  handleTaskUpdate(item=null, mutations, project, assignee=null) {
    console.assert(project && mutations);
    console.assert(project.bucket && project.type && project.id);

    let { mutator } = this.context;

    if (item) {
      mutator.batch(project.bucket).updateItem(item, mutations).commit();
    } else {
      let { viewer: { user } } = this.context;
      let { item:contact } = this.props;

      // TODO(burdon): Add to project.

      // TODO(burdon): Factor out Task creation (see task.js).
      // Create Task and add to Project.
      mutator.batch(project.bucket)

        // New task.
        .createItem('Task', _.concat(mutations, [
          MutationUtil.createFieldMutation('project', 'id', project.id),
          MutationUtil.createFieldMutation('owner',   'id', user.id),
          assignee && MutationUtil.createFieldMutation('assignee', 'id', assignee.id)
        ]), 'task')

        // Update contact.
        // TODO(burdon): Bidirectional links?
        .updateItem(contact, [
          ({ task }) => MutationUtil.createSetMutation('tasks', 'id', task.id)
        ], 'contact')

        // Parent project.
        .updateItem(project, [
          ({ task }) => MutationUtil.createSetMutation('tasks', 'id', task.id),

          // NOTE: Named since ID may have changed due to cloning.
          ({ contact }) => MutationUtil.createSetMutation('contacts', 'id', contact.id)
        ])

        .commit();
    }
  }

  /**
   * @param {[Item]} items Items
   * @param {Project} project Project that owns new tasks.
   * @param {User} owner
   * @param {User} assignee
   * @return {XML}
   */
  taskSection(project, items, owner, assignee) {
    console.assert(project && items && owner && assignee);

    let ref = `tasks_${assignee.id}`;
    let header = `Assigned to: ${assignee.title}`;

    const handleTaskUpdate = (item, mutations) => {
      this.handleTaskUpdate(item, mutations, project, owner, assignee);
    };

    return (
      <div key={ assignee.id }>
        <div className="ux-section-header">
          <h3 className="ux-expand">{ header }</h3>
          <i className="ux-icon ux-icon-add" onClick={ this.handleTaskAdd.bind(this, ref) }/>
        </div>

        <div className="ux-list-tasks">
          <div className="ux-scroll-container">
            <List ref={ ref }
                  data={ assignee.id }
                  items={ items }
                  itemEditor={ TaskItemEditor }
                  itemRenderer={ TaskItemRenderer }
                  onItemUpdate={ handleTaskUpdate }/>
          </div>
        </div>
      </div>
    );
  }

  render() {
    let { viewer } = this.context;
    let { item:contact } = this.props;
    let { user, email, thumbnailUrl, tasks, messages } = contact;

    // Default project for Viewer.
    let defaultProject = ContactCard.getProjectFromGroupsByLabel(viewer.groups, '_default');

    // Sections for team assignment.
    let assignedToViewerSection = null;
    let assignedToContactSection = null;

    // TODO(burdon): Needs a spec: Doesn't make sense to merge different projects (viewer and contact).
    // TODO(burdon): Problematic for buckets: default Project for which team?
    const showTasks = false;
    if (showTasks) {
      // Default project for User associated with the contact card.
      // Sort all tasks for this project into groups based on assignee.
      // TODO(madadam): Refactor ItemUtil.groupBy?
      let userProject = user && ContactCard.getProjectFromGroupsByLabel(user.groups, '_default');
      if (userProject) {
        let isSelf = (user && viewer.user.id === user.id);

        // Group viewer's tasks.
        // TODO(burdon): Ignore tasks assigned to me from the contact for other projects?
        let assignedToViewer = _.filter(_.get(userProject, 'tasks'), item => {
          let assignee = _.get(item, 'assignee.id');
          let owner = _.get(item, 'owner.id');

          // Special case of self-view since owner could be anyone (show all my tasks).
          if (isSelf) {
            return assignee === viewer.user.id;
          } else {
            return assignee === viewer.user.id && owner === user.id;
          }
        });

        assignedToViewerSection = this.taskSection(userProject, assignedToViewer, user, viewer.user);

        // When a user sees her own Contact card, don't show this section.
        if (!isSelf) {
          // TODO(burdon): Very specialized use case. E.g., see all Contact's tasks. Need spec.
          // Group contact's tasks (assigned from Viewer).
          let assignedToContact = _.filter(_.get(userProject, 'tasks'), item => {
            let assignee = _.get(item, 'assignee.id');
            let owner = _.get(item, 'owner.id');
            return assignee === user.id && owner === viewer.user.id;
          });

          assignedToContactSection = this.taskSection(userProject, assignedToContact, viewer.user, user);
        }
      }
    }

    const handleTaskUpdate = (item, mutations) => {
      this.handleTaskUpdate(item, mutations, defaultProject);
    };

    // TODO(burdon): Styles.
    return (
      <Card ref="card" item={ contact }>

        <div className="ux-card-section">
          <div style={{ display: 'flex', 'alignItems': 'flex-start' }}>
            { thumbnailUrl &&
            <div style={ { marginRight: '6px'} }>
              <img className="ux-img" src={ thumbnailUrl }/>
            </div>
            }
            { email &&
            <div className="ux-data-row" style={{ fontSize: '14px' }}>
              <i className="ux-icon">email</i>
              <div className="ux-text">{ email }</div>
            </div>
            }
          </div>
        </div>

        {/* Messages. */}
        { messages &&
        <div className="ux-section-header">
          <h3 className="ux-expand">Messages</h3>
        </div>
        }
        { messages &&
        <div className="ux-list ux-list-messages">
        {_.map(messages, message => (
          <div className="ux-list-item ux-row ux-data-row">
            <i className="ux-icon">email</i>
            <div key={ message.id } className="ux-text">{ message.title }</div>
          </div>
        ))}
        </div>
        }

        {/* Private tasks for Contact. */}
        <div className="ux-section-header">
          <h3 className="ux-expand">Notes</h3>
          <i className="ux-icon ux-icon-add" onClick={ this.handleTaskAdd.bind(this, 'tasks') }/>
        </div>
        <div className="ux-list-tasks">
          <div className="ux-scroll-container">
            <List ref="tasks"
                  items={ tasks }
                  itemEditor={ TaskItemEditor }
                  itemRenderer={ TaskItemRenderer }
                  onItemUpdate={ handleTaskUpdate }/>
          </div>
        </div>

        { assignedToViewerSection }
        { assignedToContactSection }

      </Card>
    );
  }
}

/**
 * Canvas.
 */
export class ContactCanvasComponent extends React.Component {

  static contextTypes = {
    mutator: PropTypes.object.isRequired,
    viewer: PropTypes.object.isRequired
  };

  static propTypes = {
    refetch: PropTypes.func.isRequired,
    item: PropTypes.object
  };

  handleSave() {
    return [];
  }

  handleTaskUpdate(item=null, mutations) {
    console.assert(mutations);
    let { mutator } = this.context;

    if (item) {
      mutator.updateItem(item, mutations);
    }
  }

  render() {
    return ReactUtil.render(this, () => {
      let { item:contact, refetch } = this.props;
      let { email, tasks } = contact;

      return (
        <Canvas ref="canvas"
                item={ contact }
                refetch={ refetch }
                onSave={ this.handleSave.bind(this)}>

          <div className="ux-section">
            <div className="ux-section-body ux-font-small">
              <div>{ email }</div>
            </div>
          </div>

          <div className="ux-section">
            <div className="ux-section-header ux-row">
              <h4 className="ux-expand ux-title">Tasks</h4>
            </div>

            <List ref="tasks"
                  className="ux-list-tasks"
                  items={ tasks }
                  itemEditor={ TaskItemEditor }
                  itemRenderer={ TaskItemRenderer }
                  onItemUpdate={ this.handleTaskUpdate.bind(this) }/>
          </div>
        </Canvas>
      );
    });
  }
}

//-------------------------------------------------------------------------------------------------
// HOC.
//-------------------------------------------------------------------------------------------------

const ContactQuery = gql`
  query ContactQuery($key: KeyInput!) {
    item(key: $key) {
      ...ItemFragment
      ...ContactTasksFragment
    }
  }

  ${Fragments.ItemFragment}
  ${Fragments.ContactTasksFragment}
`;

export const ContactCanvas = compose(
  Connector.connect(Connector.itemQuery(ContactQuery))
)(ContactCanvasComponent);
