//
// Copyright 2017 Alien Labs.
//

import React from 'react';

import { ReactUtil } from '../../util/react';
import { Actions } from '../../common/actions';
import { Activity } from '../../common/activity';

import { Layout } from './layout';

/**
 * Testing Activity.
 *
 * For experimental features and components.
 */
class TestingActivity extends React.Component {

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
      let { config, eventListener, viewer } = this.props;
      if (!viewer) {
        return;
      }

      return (
        <Layout config={ config }
                viewer={ viewer }
                eventListener={ eventListener }
                actions={ this._actions }>

          <h2>Testing</h2>

        </Layout>
      );
    });
  }
}

//-------------------------------------------------------------------------------------------------
// HOC.
//-------------------------------------------------------------------------------------------------

export default Activity.compose()(TestingActivity);
