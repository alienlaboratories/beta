//
// Copyright 2017 Alien Labs.
//

import React from 'react';

import { ReactUtil } from '../../util/react';

import { SidePanelContainer } from '../sidepanel';
import { SearchListContainer } from '../search_list';

import { Activity } from './activity';
import { Layout } from './layout';

/**
 * Admin Activity.
 */
class AdminActivity extends React.Component {

  static childContextTypes = Activity.childContextTypes;

  getChildContext() {
    return Activity.getChildContext(this.props);
  }

  constructor() {
    super(...arguments);
  }

  render() {
    return ReactUtil.render(this, () => {
      let { config, debug, actions, eventListener, viewer, navigator, typeRegistry } = this.props;
      if (!viewer) {
        return;
      }

      let sidebar = <SidePanelContainer navigator={ navigator} typeRegistry={ typeRegistry }/>;

      return (
        <Layout config={ config }
                debug={ debug }
                viewer={ viewer }
                sidebar={ sidebar }
                actions={ actions }
                eventListener={ eventListener }>

          <SearchListContainer className="ux-grow"/>

        </Layout>
      );
    });
  }
}

//-------------------------------------------------------------------------------------------------
// HOC.
//-------------------------------------------------------------------------------------------------

export default Activity.compose()(AdminActivity);
