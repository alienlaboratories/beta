//
// Copyright 2017 Alien Labs.
//

import React from 'react';

import { ReactUtil } from '../../util/react';

import { SidePanelContainer } from '../sidepanel';
import { SearchListContainer } from '../search/search_list';

import { Activity } from './activity';
import { Layout } from './layout';

/**
 * Folder Activity.
 */
class FolderActivity extends React.Component {

  static childContextTypes = Activity.childContextTypes;

  getChildContext() {
    return Activity.getChildContext(this.props);
  }

  constructor() {
    super(...arguments);
  }

  render() {
    return ReactUtil.render(this, () => {
      let { params: { folder='inbox' } } = this.props;
      let { config, debug, actions, eventListener, viewer, navigator, typeRegistry } = this.props;
      if (!viewer) {
        return;
      }

      let navbar = Layout.navbar(_.get(config, 'app.platform'), navigator);

      let sidebar = <SidePanelContainer navigator={ navigator} typeRegistry={ typeRegistry }/>;

      return (
        <Layout config={ config }
                debug={ debug }
                viewer={ viewer }
                navbar={ navbar }
                sidebar={ sidebar }
                actions={ actions }
                eventListener={ eventListener }>

          <SearchListContainer/>

        </Layout>
      );
    });
  }
}

//-------------------------------------------------------------------------------------------------
// HOC.
//-------------------------------------------------------------------------------------------------

export default Activity.compose()(FolderActivity);
