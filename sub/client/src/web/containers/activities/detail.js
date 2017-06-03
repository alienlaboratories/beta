//
// Copyright 2017 Alien Labs.
//

import React from 'react';
import { connect } from 'react-redux';

import { Const, ID } from 'alien-core';

import { ReactUtil } from '../../util/react';
import { AppAction } from '../../common/reducers';

import { SidePanelContainer } from '../sidepanel';
import { SearchListContainer } from '../search/search_list';
import { CardContainer } from '../item/item_container';

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

  constructor() {
    super(...arguments);
  }

  render() {
    return ReactUtil.render(this, () => {
      let { params: { key } } = this.props;
      let { config, debug, actions, eventListener, viewer, navigator, typeRegistry, search } = this.props;
      if (!viewer) {
        return;
      }

      let platform = _.get(config, 'app.platform');
      let navbar = Layout.navbar(platform, navigator);

      let sidebar = <SidePanelContainer navigator={ navigator} typeRegistry={ typeRegistry }/>;

      // Only show search if in web mode and search is not empty.
      let showSearch = (platform === Const.PLATFORM.WEB) && !_.isEmpty(search.text);

      // TODO(burdon): By default show card.
      let content = (
        <div className="ux-card-deck">
          <CardContainer itemKey={ ID.decodeKey(key) }/>
        </div>
      );

      return (
        <Layout config={ config }
                debug={ debug }
                viewer={ viewer }
                navbar={ navbar }
                sidebar={ sidebar }
                actions={ actions }
                eventListener={ eventListener }>

          <SplitPanel left={ showSearch && <SearchListContainer/> } right={ content }/>

        </Layout>
      );
    });
  }
}

//-------------------------------------------------------------------------------------------------
// HOC.
//-------------------------------------------------------------------------------------------------

const mapStateToProps = (state, ownProps) => {
  let { search } = AppAction.getState(state);

  return {
    search
  };
};

export default Activity.compose(
  connect(mapStateToProps)
)(DetailActivity);
