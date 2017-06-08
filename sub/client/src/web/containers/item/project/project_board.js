//
// Copyright 2017 Alien Labs.
//

import React from 'react';
import PropTypes from 'prop-types';
import gql from 'graphql-tag';

import { Fragments } from 'alien-api';

import { ReactUtil } from '../../../util/react';

import { Board } from '../../../components/board';
import { Card } from '../../../components/card';
import { Canvas } from '../../../components/canvas';
import { DragOrderModel } from '../../../components/dnd';

import { QueryItem } from '../item_container';

/**
 * Configures the board depending on the current view.
 */
class BoardAdapter {

  /**
   * Returns an ordered array of columns.
   * @param project
   * @returns {Array.<{ id, value, title }>} Column specs.
   */
  getColumns(project) { return []; }

  /**
   * Returns a funciton that maps items onto a column (ID).
   * @param state
   * @returns {function(*, *)}
   */
  getColumnMapper(state) {
    return (columns, item) => { };
  }
}

/**
 * Header.
 */
export class ProjectBoardHeader extends React.Component {

  // TODO(burdon): Pass up to DetailActivity.

  render() {
    return ReactUtil.render(this, () => {
      return <div>ProjectBoardHeader</div>;
    });
  }
}

/**
 * Project board.
 */
export class ProjectBoard extends React.Component {

  // TODO(burdon): Canvas signature.
  // TODO(burdon): Render from detail via type registry.

  static propTypes = {
    typeRegistry:   PropTypes.object.isRequired,
    mutator:        PropTypes.object.isRequired,
    viewer:         PropTypes.object.isRequired
  };

  state = {
    boardAdapter: new BoardAdapter()
  };

  constructor() {
    super(...arguments);

    this._itemOrderModel = new DragOrderModel();
  }

  handleItemSelect() {}

  handleItemUpdate() {}

  render() {
    return ReactUtil.render(this, () => {
      let { boardAdapter } = this.state;
      let { typeRegistry, viewer: { user }, item:project, boardAlias } = this.props;
      let { tasks:items } = project;

      let board = _.find(_.get(project, 'boards'), board => board.alias === boardAlias);

      return (
        <Canvas>
          <Board item={ project }
                 items={ items }
                 columns={ boardAdapter.getColumns(project, board) }
                 columnMapper={ boardAdapter.getColumnMapper(user.id) }
                 itemRenderer={ Card.ItemRenderer(typeRegistry) }
                 itemOrderModel={ this._itemOrderModel }
                 onItemDrop={ this.handleItemDrop.bind(this) }
                 onItemSelect={ this.handleItemSelect.bind(this) }
                 onItemUpdate={ this.handleItemUpdate.bind(this) }/>

        </Canvas>
      );
    });
  }
}

//
// HOC Container.
//

const ProjectItemQuery = gql`
  query ProjectItemQuery($key: KeyInput!) {
    item(key: $key) {
      ...ItemFragment
      ...ProjectFragment
    }
  }

  ${Fragments.ItemFragment}  
  ${Fragments.ProjectFragment}  
`;

export const ProjectBoardContainer = QueryItem(ProjectItemQuery)(ProjectBoard);
