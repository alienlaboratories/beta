//
// Copyright 2017 Alien Labs.
//

import React from 'react';

import { ReactUtil } from '../../util/react';
import { Actions } from '../../common/actions';
import { Activity } from '../../common/activity';

import { SidePanelContainer } from '../sidepanel';
import { SearchListContainer } from '../search_list';

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

    this._actions = Actions.actions();
  }

  render() {
    return ReactUtil.render(this, () => {
      let { config, eventListener, viewer, navigator, typeRegistry } = this.props;
      if (!viewer) {
        return;
      }

      let sidebar = <SidePanelContainer navigator={ navigator} typeRegistry={ typeRegistry }/>;

      return (
        <Layout config={ config }
                viewer={ viewer }
                sidebar={ sidebar }
                eventListener={ eventListener }
                actions={ this._actions }>

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
