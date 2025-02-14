//
// Copyright 2017 Alien Labs.
//

import React from 'react';

import { ReactUtil } from '../../util/react';

import { Activity } from './activity';
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
  }

  render() {
    return ReactUtil.render(this, () => {
      let { config, debug, viewer, actions, navigator, typeRegistry, eventListener } = this.props;
      if (!viewer) {
        return;
      }

      return (
        <Layout config={ config }
                debug={ debug }
                viewer={ viewer }
                actions={ actions }
                navigator={ navigator }
                typeRegistry={ typeRegistry }
                eventListener={ eventListener }>

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
