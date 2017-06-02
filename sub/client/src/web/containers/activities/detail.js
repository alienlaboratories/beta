//
// Copyright 2017 Alien Labs.
//

import React from 'react';
import { connect } from 'react-redux';

import { ReactUtil } from '../../util/react';
import { Actions } from '../../common/actions';
import { Activity } from '../../common/activity';
import { AppAction } from '../../common/reducers';

import { SidePanelContainer } from '../sidepanel';
import { SearchListContainer } from '../search_list';

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

    this._actions = Actions.actions();
  }

  render() {
    return ReactUtil.render(this, () => {
      let { params: { key }, config, eventListener, viewer, navigator, typeRegistry, search } = this.props;
      if (!viewer) {
        return;
      }

      let navbar = Layout.navbar(_.get(config, 'app.platform'), navigator);

      let sidebar = <SidePanelContainer navigator={ navigator} typeRegistry={ typeRegistry }/>;

      // TODO(burdon): Better test.
      let showSearch = !_.isEmpty(search.text);

      return (
        <Layout config={ config }
                viewer={ viewer }
                navbar={ navbar }
                sidebar={ sidebar }
                eventListener={ eventListener }
                actions={ this._actions }>

          <div className="ux-row ux-grow">
            { showSearch &&
            <div className="ux-panel ux-search-list-container">
              <SearchListContainer className="ux-search-list"/>
            </div>
            }

            <div className="ux-panel___ ux-grow">
              { key }
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
