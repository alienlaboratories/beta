//
// Copyright 2017 Alien Labs.
//

import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'react-apollo';
import gql from 'graphql-tag';

import { ID, MutationUtil } from 'alien-core';
import { Fragments } from 'alien-api';

import { ReactUtil } from '../../util/react';

import { Canvas } from '../../components/canvas';
import { List } from '../../components/list';

import { Connector } from '../connector';

//-------------------------------------------------------------------------------------------------
// Components.
//-------------------------------------------------------------------------------------------------

/**
 * Canvas.
 * NOTE: This is them Team Canvas for a group.
 */
class GroupCanvasComponent extends React.Component {

  static contextTypes = {
    navigator: PropTypes.object.isRequired,
    mutator: PropTypes.object.isRequired
  };

  static propTypes = {
    item: PropTypes.object
  };

  handleItemSelect(item) {
    this.context.navigator.pushCanvas(item);
  }

  handleProjectAdd() {
    this.refs.projects.addItem();
  }

  handleProjectSave(project, mutations) {
    let { mutator } = this.context;
    let { item:group } = this.props;

    if (project) {
      console.warn('Not implemented.');
    } else {
      mutator
        .batch(group.id)
        .createItem('Project', _.concat(mutations, [
          MutationUtil.createFieldMutation('group', 'key', ID.key(group))
        ]))
        .commit();
    }
  }

  handleSave() {
    return [];
  }

  render() {
    return ReactUtil.render(this, () => {
      let { item:group, refetch } = this.props;
      let { members, projects } = group;

      return (
        <Canvas ref="canvas"
                item={ group }
                refetch={ refetch }
                onSave={ this.handleSave.bind(this)}>

          <div className="ux-section">
            <div className="ux-section-header ux-row">
              <h4 className="ux-grow ux-title">Members</h4>
            </div>
            <List items={ members } onItemSelect={ this.handleItemSelect.bind(this) }/>
          </div>

          <div className="ux-section">
            <div className="ux-section-header ux-row">
              <h4 className="ux-grow ux-title">Projects</h4>
              <i className="ux-icon ux-icon-add" onClick={ this.handleProjectAdd.bind(this) }></i>
            </div>
            <List ref="projects"
                  items={ projects }
                  onItemSelect={ this.handleItemSelect.bind(this) }
                  onItemUpdate={ this.handleProjectSave.bind(this) }/>
          </div>

        </Canvas>
      );
    });
  }
}

//-------------------------------------------------------------------------------------------------
// HOC.
//-------------------------------------------------------------------------------------------------

/*
const GroupReducer = (matcher, context, previousResult, updatedItem) => {
  let { item:group } = previousResult;

  if (updatedItem.type === 'Project' && updatedItem.group === previousResult.id) {
    let projectIdx = _.findIndex(group.projects, project => project.id === updatedItem.group);
    if (projectIdx === -1) {
      return {
        item: {
          projects: {
            $push: [updatedItem]
          }
        }
      };
    }
  }
};
*/

const GroupQuery = gql`  
  query GroupQuery($key: KeyInput!) {
    item(key: $key) {
      ...GroupFragment
    }
  }

  ${Fragments.GroupFragment}  
`;

export const GroupCanvas = compose(
  Connector.connect(Connector.itemQuery(GroupQuery))
)(GroupCanvasComponent);
