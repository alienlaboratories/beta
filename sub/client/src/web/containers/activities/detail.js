//
// Copyright 2017 Alien Labs.
//

import React from 'react';
import { connect } from 'react-redux';

import { ID } from 'alien-core';

import { ReactUtil } from '../../util/react';
import { AppAction } from '../../common/reducers';

import { SidePanelContainer } from '../sidepanel';
import { SearchListContainer } from '../search_list';
import { CardContainer } from '../item/item';

import { Activity } from './activity';
import { Layout } from './layout';

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

      let navbar = Layout.navbar(_.get(config, 'app.platform'), navigator);

      let sidebar = <SidePanelContainer navigator={ navigator} typeRegistry={ typeRegistry }/>;

      // TODO(burdon): Better test.
      let showSearch = !_.isEmpty(search.text);

      // TODO(burdon): By default show card.
      let card = <CardContainer itemKey={ ID.decodeKey(key) }/>;

      return (
        <Layout config={ config }
                debug={ debug }
                viewer={ viewer }
                navbar={ navbar }
                sidebar={ sidebar }
                actions={ actions }
                eventListener={ eventListener }>

          <div className="ux-row ux-grow">
            { showSearch &&
            <div className="ux-panel ux-search-list-container">
              <SearchListContainer className="ux-search-list"/>
            </div>
            }

            <div className="ux-panel ux-grow">
              <div className="ux-card-deck">
                { card }
              </div>
            </div>
          </div>

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
