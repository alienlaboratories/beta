//
// Copyright 2017 Alien Labs.
//

import React from 'react';
import { connect } from 'react-redux';

import { Const, ID, QueryParser } from 'alien-core';

import { ReactUtil } from '../../util/react';
import { AppAction } from '../../common/reducers';

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

      // TODO(burdon): Set folder in redux state.
      // Only show search results if in web mode and search is not empty.
      let platform = _.get(config, 'app.platform');
      let searchPanel;
      if (platform === Const.PLATFORM.WEB && !QueryParser.isEmpty(filter)) {
        searchPanel = <SearchListContainer/>;
      }

      // Type-specific cards.
      let itemKey = ID.decodeKey(key);
      let CardContainer = typeRegistry.container(itemKey.type);

      // TODO(burdon): Handle default container.

      let content = (
        <div className="ux-card-deck">
          <CardContainer itemKey={ itemKey }/>
        </div>
      );

      return (
        <Layout config={ config }
                debug={ debug }
                viewer={ viewer }
                actions={ actions }
                navigator={ navigator }
                typeRegistry={ typeRegistry }
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
