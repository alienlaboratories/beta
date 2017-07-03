//
// Copyright 2017 Alien Labs.
//

import React from 'react';
import PropTypes from 'prop-types';
import gql from 'graphql-tag';
import { compose } from 'react-apollo';

import { Fragments } from 'alien-api';
import { ID, MutationUtil } from 'alien-core';

import { AppAction } from '../../../common/reducers';
import { ReactUtil } from '../../../util/react';
import { ReduxUtil } from '../../../util/redux';
import { SubscriptionWrapper } from '../../../util/subscriptions';

import { Board } from '../../../components/board';
import { Card } from '../../../components/card';
import { Canvas } from '../../../components/canvas';
import { DragOrderModel } from '../../../components/dnd';

import { QueryItem } from '../item_container';

import { TaskStatusBoardAdapter, TaskAssigneeBoardAdapter, QueryBoardAdapter } from './adapters';

import './project.less';

/**
 * Project board.
 */
export class ProjectBoard extends React.Component {

  static getAdapters(project) {
    if (!project) {
      return [];
    }

    let adapters = [
      new TaskStatusBoardAdapter(),
      new TaskAssigneeBoardAdapter()
    ];

    _.each(_.get(project, 'boards'), board => {
      let adapter = _.find(adapters, adapter => adapter.alias === board.alias);
      if (!adapter) {
        adapters.push(new QueryBoardAdapter(board));
      }
    });

    return adapters;
  }

  static DEFAULT_ALIAS = TaskStatusBoardAdapter.ALIAS;

  static contextTypes = {
    typeRegistry:   PropTypes.object.isRequired
  };

  static propTypes = {
    mutator:        PropTypes.object.isRequired,
    viewer:         PropTypes.object.isRequired,
    item:           PropTypes.object,
    boardAlias:     PropTypes.string
  };

  constructor() {
    super(...arguments);

    let { typeRegistry } = this.context;
    let { viewer, mutator } = this.props;

    this._itemRenderer = Card.ItemRenderer(typeRegistry, mutator, viewer);
    this._itemOrderModel = new DragOrderModel();

    this.state = this.getState(this.props);
  }

  componentWillReceiveProps(nextProps) {
    this.setState(this.getState(nextProps));
  }

  getState(props) {
    let { item:project, boardAlias } = props;

    // TODO(burdon): Cache (in redux); use in header also.
    let adapters = ProjectBoard.getAdapters(project);

    return {
      project,
      adapters,
      adapter: _.find(adapters, adapter => adapter.alias === boardAlias)
    };
  }

  handleTaskSelect() {
    console.log('handleItemSelect', arguments);
  }

  handleItemDrop(column, item, changes) {
    let { viewer: { groups }, item:project, boardAlias, mutator } = this.props;
    let { adapter } = this.state;

    let batch = mutator.batch(groups, project.bucket);

    // Update item for column.
    let dropMutations = adapter.onDropItem(column);
    if (dropMutations) {
      batch.updateItem(item, dropMutations);
    }

    // Update item order.
    batch.updateItem(project, _.map(changes, change =>
      MutationUtil.createProjectBoardMutation(boardAlias, change.listId, change.itemId, change.order)));

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
      let { adapter } = this.state;
      let { item:project, boardAlias } = this.props;

      // Column-specific mutations.
      let adapterMutations = adapter.onCreateItem(column);

      let board = _.find(_.get(project, 'boards'), board => board.alias === boardAlias);
      let filter = _.get(board, 'filter');
      if (filter) {
        // TODO(burdon): MOVE TO BOARD ADAPTER.
        filter = JSON.parse(filter);
        console.assert(filter.type);

        _.each(filter.labels, label => {
          mutations.push(MutationUtil.createSetMutation('labels', 'string', label));
        });

        mutator
          .batch(groups, project.bucket)
          .createItem(filter.type, [
            adapterMutations,
            mutations
          ])
          .commit();
      } else {
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
  }

  render() {
    return ReactUtil.render(this, () => {
      let { adapter } = this.state;
      let { item:project, boardAlias } = this.props;
      console.assert(project);

      let board = _.find(_.get(project, 'boards'), board => board.alias === boardAlias);
      let items = adapter.getItems(project, board);

      // TODO(burdon): Lift-up Canvas.
      return (
        <Canvas>
          <Board item={ project }
                 items={ items }
                 columns={ adapter.getColumns(project, board) }
                 columnMapper={ adapter.getColumnMapper(project, board) }
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

export const ProjectBoardContainer = compose(

  ReduxUtil.connect({
    mapStateToProps: (state, ownProps) => {
      let { canvas: { boardAlias=ProjectBoard.DEFAULT_ALIAS } } = AppAction.getState(state);

      return {
        boardAlias
      };
    }
  }),

  QueryItem(ProjectItemQuery)

)(SubscriptionWrapper(ProjectBoard));
