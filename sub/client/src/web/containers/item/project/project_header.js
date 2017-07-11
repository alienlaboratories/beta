//
// Copyright 2017 Alien Labs.
//

import React from 'react';
import PropTypes from 'prop-types';
import gql from 'graphql-tag';
import { compose } from 'react-apollo';

import { Fragments } from 'alien-api';
import { MutationUtil, QueryParser } from 'alien-core';
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

  handleTitleUpdate(title) {
    let { viewer: { groups }, mutator, item:project } = this.props;

    mutator.batch(groups, project.bucket)
      .updateItem(project, [
        MutationUtil.createFieldMutation('title', 'string', title)
      ])
      .commit();
  }

  handleBoardSelect(adapter) {
    let { editing, setBoardAlias } = this.props;

    if (editing) {
      if (adapter.editable) {
        console.log('Delete', adapter.alias);
        let { viewer: { groups }, mutator, item:project } = this.props;

        // TODO(burdon): Factor out.
        let mutations = [
          {
            field: 'boards',
            value: {
              map: [{
                predicate: {
                  key: 'alias',
                  value: {
                    string: adapter.alias
                  }
                },

                value: {
                  null: true
                }
              }]
            }
          }
        ];

        mutator.batch(groups, project.bucket)
          .updateItem(project, mutations)
          .commit();
      }
    } else {
      setBoardAlias(adapter.alias);
    }
  }

  handleBoardEdit() {
    let { editing, setBoardEdit } = this.props;

    setBoardEdit(!editing);
  }

  handleBoardAdd() {
    let { viewer: { groups }, mutator, item:project, search } = this.props;
    if (!QueryParser.isEmpty(search.filter)) {

      // TODO(burdon): Factor out.
      let mutations = [
        {
          field: 'boards',
          value: {
            array: [{
              value: {
                // TODO(burdon): Wrapper.
                json: JSON.stringify({
                  __typename: 'Board',
                  alias: 'query_' + _.size(project.boards),
                  title: 'Query',
                  icon: 'star',
                  columns: [
                    {
                      __typename: 'BoardColumn',
                      id:         'prospect',
                      value:      { __typename: 'ValueInput', string: 'prospect' },
                      title:      'Prospect'
                    },
                    {
                      __typename: 'BoardColumn',
                      id:         'active',
                      value:      { __typename: 'ValueInput', string: 'active' },
                      title:      'Active'
                    },
                    {
                      __typename: 'BoardColumn',
                      id:         'commit',
                      value:      { __typename: 'ValueInput', string: 'commit' },
                      title:      'Commit'
                    }
                  ],
                  filter: search.filter
                })
              }
            }]
          }
        }
      ];

      mutator.batch(groups, project.bucket)
        .updateItem(project, mutations)
        .commit();
    }
  }

  render() {
    return ReactUtil.render(this, () => {
      let { item:project, search, editing, boardAlias } = this.props;
      console.assert(project);

      // TODO(burdon): Cache adapters (or get from Redux).
      let icons = _.map(ProjectBoard.getAdapters(project), adapter => {
        return (
          <i key={ adapter.alias }
             className={ DomUtil.className('ux-icon',
               editing && adapter.editable && 'ux-icon-editable', adapter.alias === boardAlias && 'ux-selected') }
             title={ adapter.title }
             onClick={ this.handleBoardSelect.bind(this, adapter) }>{ adapter.icon }</i>
        );
      });

      icons.push(<i key="_spacer" className="ux-icon-spacer"/>);

      if (!QueryParser.isEmpty(search.filter)) {
        icons.push(
          <i key="_add" className="ux-icon ux-icon-add" onClick={ this.handleBoardAdd.bind(this) }/>
        );
      }

      icons.push(
        <i key="_edit" className={ DomUtil.className('ux-icon', editing ? 'ux-icon-cancel' : 'ux-icon-edit') }
           onClick={ this.handleBoardEdit.bind(this) }/>
      );

      return (
        <div className="ux-board-header ux-row ux-grow">
          <div className={ DomUtil.className('ux-icons', editing && 'ux-editing') }>{ icons }</div>

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
      let { search, canvas: { editing, boardAlias=ProjectBoard.DEFAULT_ALIAS } } = AppAction.getState(state);

      return {
        search,
        editing,
        boardAlias
      };
    },

    mapDispatchToProps: (dispatch, ownProps) => {
      return {
        setBoardAlias: (boardAlias) => {
          dispatch(AppAction.setCanvasState({
            editing: false,
            boardAlias
          }));
        },

        setBoardEdit: (editing) => {
          dispatch(AppAction.setCanvasState({
            editing
          }));
        }
      };
    }
  }),

  QueryItem(ProjectHeaderQuery)

)(ProjectBoardHeader);
