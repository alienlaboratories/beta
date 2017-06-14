//
// Copyright 2017 Alien Labs.
//

import React from 'react';
import PropTypes from 'prop-types';
import gql from 'graphql-tag';
import { compose } from 'react-apollo';

import { Fragments } from 'alien-api';
import { MutationUtil } from 'alien-core';
import { DomUtil } from 'alien-util';

import { AppAction } from '../../../common/reducers';
import { ReactUtil } from '../../../util/react';
import { ReduxUtil } from '../../../util/redux';

import { TextBox } from '../../../components/textbox';

import { QueryItem } from '../item_container';

import { ProjectBoard } from './project_board';

import './project.less';

/**
 * Header.
 */
class ProjectBoardHeader extends React.Component {

  static propTypes = {
    mutator:        PropTypes.object.isRequired,
    viewer:         PropTypes.object.isRequired,
    item:           PropTypes.object
  };

  // TODO(burdon): Redux action to select board alias.

  handleTitleUpdate(title) {
    let { viewer: { groups }, mutator, item:project } = this.props;

    mutator.batch(groups, project.bucket)
      .updateItem(project, [
        MutationUtil.createFieldMutation('title', 'string', title)
      ])
      .commit();
  }

  handleBoardSelect(alias) {
    console.log('Select', alias);
    this.props.setBoardAlias(alias);
  }

  render() {
    return ReactUtil.render(this, () => {
      let { item:project, boardAlias } = this.props;

      let icons = _.map(ProjectBoard.BOARD_ADAPTERS, adapter => {
        return (
          <i key={ adapter.alias }
             className={ DomUtil.className('ux-icon', adapter.alias === boardAlias && 'ux-selected') }
             title={ adapter.title }
             onClick={ this.handleBoardSelect.bind(this, adapter.alias) }>{ adapter.icon }</i>
        );
      });

      return (
        <div className="ux-board-header ux-row ux-grow">
          <div className="ux-icons">{ icons }</div>

          <div className="ux-title ux-grow">
            <TextBox value={ project.title }
                     clickToEdit={ true }
                     onEnter={ this.handleTitleUpdate.bind(this) }/>
          </div>
        </div>
      );
    });
  }
}

//
// HOC Container.
//

const ProjectHeaderQuery = gql`
  query ProjectHeaderQuery($key: KeyInput!) {
    item(key: $key) {
      ...ItemFragment
      ...ProjectBoardFragment
    }
  }

  ${Fragments.ItemFragment}  
  ${Fragments.ProjectBoardFragment}  
`;

export const ProjectBoardHeaderContainer = compose(

  ReduxUtil.connect({
    mapStateToProps: (state, ownProps) => {
      let { canvas: { boardAlias=ProjectBoard.DEFAULT_ALIAS } } = AppAction.getState(state);

      return {
        boardAlias
      };
    },

    mapDispatchToProps: (dispatch, ownProps) => {
      return {
        setBoardAlias: (boardAlias) => {
          dispatch(AppAction.setCanvasState({
            boardAlias
          }));
        }
      };
    }
  }),

  QueryItem(ProjectHeaderQuery)

)(ProjectBoardHeader);
