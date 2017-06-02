//
// Copyright 2017 Alien Labs.
//

import React from 'react';
import PropTypes from 'prop-types';

import { Logger } from 'alien-util';
import { Const } from 'alien-core';

import { ReactUtil } from '../../util/react';
import { Navbar } from '../../components/navbar';
import { Activity } from '../../common/activity';

import Finder from '../finder';
import SearchPanel from '../search';

import { Layout } from './layout';

const logger = Logger.get('finder');

/**
 * Finder Activity.
 */
class FinderActivity extends React.Component {

  /**
   * Params set by the router.
   */
  static propTypes = {
    params: PropTypes.shape({
      folder: PropTypes.string.isRequired
    })
  };

  static childContextTypes = Activity.childContextTypes;

  getChildContext() {
    return Activity.getChildContext(this.props);
  }

  render() {
    return ReactUtil.render(this, () => {
      let { config, viewer, contextManager, params: { folder='inbox' } } = this.props;
//    let { params: { folder='inbox' } } = match;
      logger.log('Folder:', folder);

      let navbar = <Navbar><SearchPanel/></Navbar>;

      let finder = <Finder viewer={ viewer } folder={ folder } contextManager={ contextManager }/>;

      let content = null;
      let platform = _.get(config, 'app.platform');
      if (platform !== Const.PLATFORM.MOBILE && platform !== Const.PLATFORM.CRX) {
        content = <div/>;
      }

      return (
        <Layout navbar={ navbar } finder={ finder }>{ content }</Layout>
      );
    });
  }
}

export default Activity.compose()(FinderActivity);
