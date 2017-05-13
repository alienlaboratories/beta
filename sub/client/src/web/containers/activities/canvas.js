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
    onSave: PropTypes.func.isRequired,
    type:   PropTypes.string.isRequired,
    itemId: PropTypes.string.isRequired,
    canvas: PropTypes.string,
  };

  static contextTypes = {
    typeRegistry: PropTypes.object.isRequired,
  };

  render() {
    let { typeRegistry } = this.context;
    let { onSave, itemId } = this.props;

    let { type } = ID.fromGlobalId(itemId);
    let Toolbar = typeRegistry.toolbar(type);
    let toolbar = Toolbar && <Toolbar/>;

    // TODO(burdon): Save button.
    return (
      <Navbar>
        <SearchPanel/>
        <ItemCanvasHeader onSave={ onSave } itemId={ itemId } toolbar={ toolbar }/>
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
      canvas: PropTypes.string,
      itemId: PropTypes.string.isRequired
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
      let { config, viewer, params: { type, canvas, itemId } } = this.props;
//    let { params: { type, canvas, itemId } } = match;

      let navbar = (
        <CanvasNavbar onSave={ this.handleSave.bind(this) } canvas={ canvas } type={ type } itemId={ itemId }/>
      );

      let canvasComponent = (
        <CanvasContainer ref="canvas" canvas={ canvas } type={ type } itemId={ itemId }/>
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
