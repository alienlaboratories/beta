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
 * Search Activity.
 */
class SearchActivity extends React.Component {

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
      let { params: { folder='inbox' }, config, eventListener, viewer, navigator, typeRegistry } = this.props;
      if (!viewer) {
        return;
      }

      let navbar = Layout.navbar(_.get(config, 'app.platform'), navigator);

      let sidebar = <SidePanelContainer navigator={ navigator} typeRegistry={ typeRegistry }/>;

      return (
        <Layout config={ config }
                viewer={ viewer }
                navbar={ navbar }
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

export default Activity.compose()(SearchActivity);
