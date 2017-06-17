//
// Copyright 2017 Alien Labs.
//

import React from 'react';
import { Link } from 'react-router';

import { ID, MutationUtil } from 'alien-core';

import { ReactUtil } from '../../util/react';
import { ReduxUtil } from '../../util/redux';
import { Path } from '../../common/path';
import { Card } from '../../components/card';

import { Activity } from './activity';
import { Layout } from './layout';

import './home.less';

/**
 * Home Activity.
 */
class HomeActivity extends React.Component {

  static childContextTypes = Activity.childContextTypes;

  getChildContext() {
    return Activity.getChildContext(this.props);
  }

  handleCreateProject(group) {
    let { viewer: { groups }, mutator, navigator } = this.props;

    // TODO(burdon): Refresh viewer.
    mutator.batch(groups, group.id)
      .createItem('Project', [
        MutationUtil.createFieldMutation('group', 'key', ID.key(group)),
        MutationUtil.createFieldMutation('title', 'string', 'New Project')
      ], 'new')
      .commit()
      .then(({ batch }) => {
        navigator.pushCanvas(batch.refs['new']);
      });
  }

  render() {
    return ReactUtil.render(this, () => {
      let { config, debug, mutator, viewer, actions, navigator, typeRegistry, eventListener } = this.props;
      if (!viewer) {
        return;
      }

      let ItemRenderer = Card.ItemRenderer(typeRegistry, mutator, viewer);

      let groups = _.map(viewer.groups, group => {

        // Current projects.
        let projects = _.map(group.projects, project => {
          return (
            <ItemRenderer key={ project.id } item={ project } readOnly={ true }/>
          );
        });

        // New Project.
        projects.push(
          <div key="_create" className="ux-card ux-home-create"
               onClick={ this.handleCreateProject.bind(this, group) }>
            <div className="ux-title">New Project</div>
          </div>
        );

        return (
          <div key={ group.id } className="ux-home-group">
            <div className="ux-header ux-row">
              <Link to={ Path.canvas(ID.key(group)) }>
                <i className="ux-icon ux-icon-group"/>
              </Link>

              <h2>{ group.title }</h2>
            </div>

            <div className="ux-row ux-card-deck">{ projects }</div>
          </div>
        );
      });

      return (
        <Layout config={ config }
                debug={ debug }
                viewer={ viewer }
                actions={ actions }
                navigator={ navigator }
                typeRegistry={ typeRegistry }
                eventListener={ eventListener }
                nav={ false }>

          <div className="ux-home ux-column ux-grow">
            { groups }
          </div>

        </Layout>
      );
    });
  }
}

//-------------------------------------------------------------------------------------------------
// HOC.
//-------------------------------------------------------------------------------------------------

export default Activity.compose(
  ReduxUtil.connect({
    mapStateToProps: (state, ownProps) => {
      return {
        refetchQueries: () => ['ViewerQuery']
      };
    }
  })
)(HomeActivity);
