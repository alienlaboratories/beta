//
// Copyright 2017 Alien Labs.
//

import React from 'react';

import { Const } from 'alien-core';

import { ReactUtil } from '../../util/react';

import { SidePanelContainer } from '../sidepanel';
import { SearchListContainer, CardDeckContainer } from '../search/search_list';

import { Activity } from './activity';
import { Layout, SplitPanel } from './layout';

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

      let platform = _.get(config, 'app.platform');

      let navbar = Layout.navbar(platform, navigator);

      let sidebar = <SidePanelContainer navigator={ navigator } typeRegistry={ typeRegistry }/>;

      let content = (platform === Const.PLATFORM.WEB) ? <SearchListContainer/> : <CardDeckContainer/>;

      // Wrap with split panel if in web mode (so the search panel doesn't expand).
      if (platform === Const.PLATFORM.WEB) {
        content = <SplitPanel left={ content }/>;
      }

      return (
        <Layout config={ config }
                debug={ debug }
                viewer={ viewer }
                navbar={ navbar }
                sidebar={ sidebar }
                actions={ actions }
                eventListener={ eventListener }>

          { content }

        </Layout>
      );
    });
  }
}

//-------------------------------------------------------------------------------------------------
// HOC.
//-------------------------------------------------------------------------------------------------

export default Activity.compose()(FolderActivity);
