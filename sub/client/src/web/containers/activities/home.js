//
// Copyright 2017 Alien Labs.
//

import React from 'react';
import { Link } from 'react-router';

import { ID } from 'alien-core';

import { Path } from '../../common/path';
import { ReactUtil } from '../../util/react';

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

  render() {
    return ReactUtil.render(this, () => {
      let { config, debug, viewer, actions, navigator, typeRegistry, eventListener } = this.props;
      if (!viewer) {
        return;
      }

      // TODO(burdon): Use card renderers.

      let groups = _.map(viewer.groups, group => {

        let projects = _.map(group.projects, project => {
          return (
            <div key={ project.id } className="ux-home-project">
              <div className="ux-header ux-row">
                <Link to={ Path.canvas(ID.key(project)) }>
                  <h3>{ project.title }</h3>
                </Link>
              </div>
            </div>
          );
        });

        // TODO(burdon): Create new.

        return (
          <div key={ group.id } className="ux-home-group">
            <div className="ux-header ux-row">
              <i className="ux-icon ux-icon-group"/>
              <h2>{ group.title }</h2>
            </div>

            <div className="ux-row">{ projects }</div>
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

          <div className="ux-home ux-column">
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

export default Activity.compose()(HomeActivity);
