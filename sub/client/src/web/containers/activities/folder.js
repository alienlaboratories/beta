//
// Copyright 2017 Alien Labs.
//

import React from 'react';

import { Logger } from 'alien-util';
import { Const } from 'alien-core';

import { ReactUtil } from '../../util/react';

import { SidePanelContainer } from '../sidepanel';
import { SearchListContainer, CardDeckContainer } from '../search/search_list';

import { Activity } from './activity';
import { Layout, SplitPanel } from './layout';

const logger = Logger.get('folder');

/**
 * Folder Activity.
 */
class FolderActivity extends React.Component {

  static childContextTypes = Activity.childContextTypes;

  getChildContext() {
    return Activity.getChildContext(this.props);
  }

  render() {
    return ReactUtil.render(this, () => {
      let { params: { folder='inbox' } } = this.props;
      let { config, debug, actions, eventListener, viewer, navigator, typeRegistry } = this.props;
      if (!viewer) {
        return;
      }

      // Set the default filter from the current folder.
      let folderItem = _.find(viewer.folders, f => f.alias === folder);
      let defaultFilter = JSON.parse(_.get(folderItem, 'filter', '{}'));
      if (!folderItem) {
        logger.warn('Invalid folder: ' + folder);
      }

      let sidebar = <SidePanelContainer navigator={ navigator } typeRegistry={ typeRegistry }/>;

      let platform = _.get(config, 'app.platform');
      let content = (platform === Const.PLATFORM.WEB) ?
        <SearchListContainer filter={ defaultFilter }/>:
        <CardDeckContainer filter={ defaultFilter }/>;

      // Wrap with split panel if in web mode (so the search panel doesn't expand).
      if (platform === Const.PLATFORM.WEB) {
        content = <SplitPanel left={ content }/>;
      }

      return (
        <Layout config={ config }
                debug={ debug }
                viewer={ viewer }
                sidebar={ sidebar }
                actions={ actions }
                navigator={ navigator }
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
