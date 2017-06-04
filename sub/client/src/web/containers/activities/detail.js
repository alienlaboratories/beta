//
// Copyright 2017 Alien Labs.
//

import React from 'react';
import { connect } from 'react-redux';

import { Const, ID, QueryParser } from 'alien-core';

import { ReactUtil } from '../../util/react';
import { AppAction } from '../../common/reducers';

import { SidePanelContainer } from '../sidepanel';
import { SearchListContainer } from '../search/search_list';

import { Activity } from './activity';
import { Layout, SplitPanel } from './layout';

import './detail.less';

/**
 * Detail Activity.
 */
class DetailActivity extends React.Component {

  static childContextTypes = Activity.childContextTypes;

  getChildContext() {
    return Activity.getChildContext(this.props);
  }

  render() {
    return ReactUtil.render(this, () => {
      let { params: { key } } = this.props;
      let { config, debug, actions, eventListener, viewer, navigator, typeRegistry, filter } = this.props;
      if (!viewer) {
        return;
      }

      let sidebar = <SidePanelContainer navigator={ navigator} typeRegistry={ typeRegistry }/>;

      // Only show search results if in web mode and search is not empty.
      let platform = _.get(config, 'app.platform');
      let searchPanel =
        (platform === Const.PLATFORM.WEB) && !QueryParser.isEmpty(filter) && <SearchListContainer/>;

      // TODO(burdon): typeRegistry should return card no container (so can be used in list).
      // TODO(burdon): Either basic Card and CardContainer with plugins or TR returns both card and container.
      // Type-specific cards.
      let itemKey = ID.decodeKey(key);
      let CardContainer = typeRegistry.card(itemKey.type);

      let content = (
        <div className="ux-card-deck">
          <CardContainer itemKey={ itemKey }/>
        </div>
      );

      return (
        <Layout config={ config }
                debug={ debug }
                viewer={ viewer }
                sidebar={ sidebar }
                actions={ actions }
                navigator={ navigator }
                eventListener={ eventListener }>

          <SplitPanel left={ searchPanel } right={ content }/>

        </Layout>
      );
    });
  }
}

//-------------------------------------------------------------------------------------------------
// HOC.
//-------------------------------------------------------------------------------------------------

const mapStateToProps = (state, ownProps) => {
  let { search: { filter } } = AppAction.getState(state);

  return {
    filter
  };
};

export default Activity.compose(
  connect(mapStateToProps)
)(DetailActivity);
