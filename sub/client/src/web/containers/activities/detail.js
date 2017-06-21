//
// Copyright 2017 Alien Labs.
//

import React from 'react';
import { connect } from 'react-redux';

import { Const, ID, QueryParser } from 'alien-core';

import { ReactUtil } from '../../util/react';
import { AppAction } from '../../common/reducers';
import { ItemCardContainer } from '../../containers/item/item_container';

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
      let { config, debug, viewer, actions, navigator, typeRegistry, eventListener, mutator, filter } = this.props;
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

      // Type-specific containers (card/canvas).
      let itemKey = ID.decodeKey(key);

      let Container = typeRegistry.container(itemKey.type) || ItemCardContainer;
      let container = <Container mutator={ mutator } viewer={ viewer } itemKey={ itemKey }/>;

      let Header = typeRegistry.header(itemKey.type);
      let header = Header && <Header mutator={ mutator } viewer={ viewer } itemKey={ itemKey }/>;

      return (
        <Layout config={ config }
                debug={ debug }
                viewer={ viewer }
                actions={ actions }
                navigator={ navigator }
                typeRegistry={ typeRegistry }
                eventListener={ eventListener }
                header={ header }>

          <SplitPanel left={ searchPanel }
                      right={ container }/>

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
