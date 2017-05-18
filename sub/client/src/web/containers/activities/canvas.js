//
// Copyright 2017 Alien Labs.
//

import React from 'react';
import PropTypes from 'prop-types';

import { ID } from 'alien-core';

import { AppDefs } from '../../../common/defs';

import { ReactUtil } from '../../util';
import { Activity } from '../../common/activity';

import { CanvasContainer } from '../../components/canvas';
import { Navbar } from '../../components/navbar';

import { ItemCanvasHeader } from '../item';
import Finder from '../finder';
import SearchPanel from '../search';

import { Layout } from './layout';

/**
 * Canvas navbar,
 */
class CanvasNavbar extends React.Component {

  static propTypes = {
    itemKey:  PropTypes.object.isRequired,
    canvas:   PropTypes.string,
    onSave:   PropTypes.func.isRequired,
  };

  static contextTypes = {
    typeRegistry: PropTypes.object.isRequired,
  };

  render() {
    let { typeRegistry } = this.context;
    let { itemKey, onSave } = this.props;

    let Toolbar = typeRegistry.toolbar(itemKey.type);
    let toolbar = Toolbar && <Toolbar/>;

    // TODO(burdon): Save button.
    return (
      <Navbar>
        <SearchPanel/>
        <ItemCanvasHeader onSave={ onSave } itemKey={ itemKey } toolbar={ toolbar }/>
      </Navbar>
    );
  }
}

/**
 * Canvas Activity.
 */
class CanvasActivity extends React.Component {

  /**
   * Params set by the router.
   */
  static propTypes = {
    params: PropTypes.shape({
      type: PropTypes.string.isRequired,
      key: PropTypes.string.isRequired,
      canvas: PropTypes.string,
    })
  };

  static childContextTypes = Activity.childContextTypes;

  getChildContext() {
    return Activity.getChildContext(this.props);
  }

  handleSave() {
    this.refs.canvas.save();
  }

  render() {
    return ReactUtil.render(this, () => {
      let { config, viewer, params: { canvas, key:encodedKey } } = this.props;
//    let { params: { canvas, key } } = match;
      let key = ID.decodeKey(encodedKey);

      let navbar = (
        <CanvasNavbar itemKey={ key } canvas={ canvas } onSave={ this.handleSave.bind(this) }/>
      );

      let canvasComponent = (
        <CanvasContainer ref="canvas" itemKey={ key } canvas={ canvas }/>
      );

      let finder = null;
      let platform = _.get(config, 'app.platform');
      if (platform !== AppDefs.PLATFORM.MOBILE && platform !== AppDefs.PLATFORM.CRX) {
        finder = <Finder viewer={ viewer } folder={ 'inbox' }/>;
      }

      return (
        <Layout navbar={ navbar } finder={ finder }>
          { canvasComponent }
        </Layout>
      );
    });
  }
}

export default Activity.compose()(CanvasActivity);
