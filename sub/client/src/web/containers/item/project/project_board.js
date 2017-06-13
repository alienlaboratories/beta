//
// Copyright 2017 Alien Labs.
//

import React from 'react';
import PropTypes from 'prop-types';
import gql from 'graphql-tag';

import { Fragments } from 'alien-api';
import { ID, MutationUtil } from 'alien-core';

import { ReactUtil } from '../../../util/react';

import { Board } from '../../../components/board';
import { Card } from '../../../components/card';
import { Canvas } from '../../../components/canvas';
import { DragOrderModel } from '../../../components/dnd';

import { QueryItem } from '../item_container';

import { TaskStatusBoardAdapter } from './adapters';

import './project.less';

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

  static boardAdapers = [
    new TaskStatusBoardAdapter()
  ];

  static contextTypes = {
    typeRegistry:   PropTypes.object.isRequired
  };

  static propTypes = {
    mutator:        PropTypes.object.isRequired,
    viewer:         PropTypes.object.isRequired,
    boardAlias:     PropTypes.string
  };

  static defaultProps = {
    boardAlias:     TaskStatusBoardAdapter.ALIAS
  };

  constructor() {
    super(...arguments);

    let { typeRegistry } = this.context;
    let { viewer, mutator, boardAlias } = this.props;

    this._itemRenderer = Card.ItemRenderer(typeRegistry, mutator, viewer);
    this._itemOrderModel = new DragOrderModel();

    this.state = {
      boardAdapter: _.find(ProjectBoard.boardAdapers, adapter => adapter.alias === boardAlias)
    };
  }

  handleTaskSelect() {
    console.log('handleItemSelect', arguments);
  }

  handleItemDrop(column, item, changes) {
    let { viewer: { groups }, item:project, boardAlias, mutator } = this.props;
    let { boardAdapter } = this.state;

    let batch = mutator.batch(groups, project.bucket);

    // Update item for column.
    let dropMutations = boardAdapter.onDropItem(column);
    if (dropMutations) {
      batch.updateItem(item, dropMutations);
    }

    // Update item order.
    batch.updateItem(project, _.map(changes, change => ({
      field: 'boards',
      value: {
        map: [{

          // Upsert the given keyed value (in the array).
          predicate: {
            key: 'alias',
            value: {
              string: boardAlias
            }
          },

          value: {
            object: [{
              field: 'itemMeta',
              value: {
                map: [{

                  // Upsert item.
                  predicate: {
                    key: 'itemId',
                    value: {
                      string: change.itemId
                    }
                  },
                  value: {
                    object: [
                      {
                        field: 'listId',
                        value: {
                          string: change.listId
                        }
                      },
                      {
                        field: 'order',
                        value: {
                          float: change.order
                        }
                      }
                    ]
                  }
                }]
              }
            }]
          }
        }]
      }
    })));

    batch.commit();
  }

  handleTaskUpdate(item, mutations, column) {
    let { viewer: { user, groups }, mutator } = this.props;

    if (item) {
      // Update.
      mutator
        .batch(groups, item.bucket)
        .updateItem(item, mutations)
        .commit();

    } else {
      let { boardAdapter } = this.state;
      let { item:project } = this.props;

      // TODO(burdon): Task specific.
      // TODO(burdon): Remove create button for other types.
      // Column-specific mutations.
      let adapterMutations = boardAdapter.onCreateItem(column);

      // Create.
      mutator
        .batch(groups, project.bucket)
        .createItem('Task', [
          MutationUtil.createFieldMutation('owner', 'key', ID.key(user)),
          MutationUtil.createFieldMutation('project', 'key', ID.key(project)),
          adapterMutations,
          mutations
        ], 'task')
        .updateItem(project, [
          ({ task }) => MutationUtil.createSetMutation('tasks', 'key', ID.key(task))
        ])
        .commit();
    }
  }

  render() {
    return ReactUtil.render(this, () => {
      let { boardAdapter } = this.state;
      let { item:project, boardAlias } = this.props;
      let { tasks } = project;

      let board = _.find(_.get(project, 'boards'), board => board.alias === boardAlias);

      console.log('$$$$ RENDER');

      // TODO(burdon): Lift-up Canvas.
      return (
        <Canvas>
          <Board item={ project }
                 items={ tasks }
                 columns={ boardAdapter.getColumns(project, board) }
                 columnMapper={ boardAdapter.getColumnMapper() }
                 itemRenderer={ this._itemRenderer }
                 itemOrderModel={ this._itemOrderModel }
                 onItemSelect={ this.handleTaskSelect.bind(this) }
                 onItemDrop={ this.handleItemDrop.bind(this) }
                 onItemUpdate={ this.handleTaskUpdate.bind(this) }/>

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
      ...ProjectBoardFragment
    }
  }

  ${Fragments.ItemFragment}  
  ${Fragments.ProjectFragment}  
  ${Fragments.ProjectBoardFragment}  
`;

export const ProjectBoardContainer = QueryItem(ProjectItemQuery)(ProjectBoard);
