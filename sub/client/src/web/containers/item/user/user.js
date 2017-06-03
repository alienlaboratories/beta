//
// Copyright 2017 Alien Labs.
//

import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'react-apollo';
import gql from 'graphql-tag';

import { Fragments } from 'alien-api';

import { ReactUtil } from '../../util/react';

import { Canvas } from '../../components/canvas';
import { List } from '../../components/list';

import { Connector } from '../connector';

import { TaskItemEditor, TaskItemRenderer } from './task';

//-------------------------------------------------------------------------------------------------
// Components.
//-------------------------------------------------------------------------------------------------

/**
 * Canvas.
 */
class UserCanvasComponent extends React.Component {

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

  handleItemUpdate(item, mutations) {
    console.warn('Not implemented.');
  }

  handleSave() {
    return [];
  }

  render() {
    return ReactUtil.render(this, () => {
      let { item:user, refetch } = this.props;
      let { ownerTasks, assigneeTasks } = user;

      return (
        <Canvas ref="canvas"
                item={ user }
                refetch={ refetch }
                onSave={ this.handleSave.bind(this)}>

          <div className="ux-section">
            <div className="ux-section-header ux-row">
              <h3 className="ux-grow ux-title">Owner</h3>
            </div>
            <List ref="tasks"
                  className="ux-list-tasks"
                  items={ ownerTasks }
                  itemEditor={ TaskItemEditor }
                  itemRenderer={ TaskItemRenderer }
                  onItemSelect={ this.handleItemSelect.bind(this) }
                  onItemUpdate={ this.handleItemUpdate.bind(this) }/>
          </div>

          <div className="ux-section">
            <div className="ux-section-header ux-row">
              <h3 className="ux-grow ux-title">Assigned</h3>
            </div>
            <List items={ assigneeTasks }
                  className="ux-list-tasks"
                  itemEditor={ TaskItemEditor }
                  itemRenderer={ TaskItemRenderer }
                  onItemSelect={ this.handleItemSelect.bind(this) }
                  onItemUpdate={ this.handleItemUpdate.bind(this) }/>
          </div>

        </Canvas>
      );
    });
  }
}

//-------------------------------------------------------------------------------------------------
// HOC.
//-------------------------------------------------------------------------------------------------

const UserQuery = gql`
  query UserQuery($key: KeyInput!) {
    item(key: $key) {
      ...UserFragment
    }
  }

  ${Fragments.UserFragment}  
`;

export const UserCanvas = compose(
  Connector.connect(Connector.itemQuery(UserQuery))
)(UserCanvasComponent);
