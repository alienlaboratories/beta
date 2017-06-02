//
// Copyright 2017 Alien Labs.
//

import React from 'react';
import PropTypes from 'prop-types';

import { Const, ID } from 'alien-core';

import { getWrappedInstance, ReactUtil } from '../../util';
import { Activity } from '../../common/activity';

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
 * Canvas container.
 *
 * <CanvasContainer>                    Instantiated by activity with type-specific content.
 *   <ProjectCanvas>                    Wraps the Canvas element (for consistent layout); provides the mutator.
 *     <Canvas>
 *       <div>{ customLayout }</div>
 *     </Canvas>
 *   </ProjectCanvas>
 * </CanvasContainer>
 *
 * The container uses the TypeRegistry to obtain the custom canvas HOC.
 */
export class CanvasContainer extends React.Component {

  static propTypes = {
    itemKey: PropTypes.object.isRequired,
    canvas: PropTypes.string,
  };

  static contextTypes = {
    // TODO(burdon): Remove.
    typeRegistry: PropTypes.object.isRequired
  };

  save() {
    let component = getWrappedInstance(this.refs.canvas);
    component.canvas.save();
  }

  render() {
    let { typeRegistry } = this.context;
    let { itemKey, canvas } = this.props;

    // TODO(burdon): Remove dependency on typeRegistry.
    let TypeCanvas = typeRegistry.canvas(itemKey.type, canvas);

    return (
      <div className="ux-canvas-container">
        <TypeCanvas ref="canvas" itemKey={ itemKey }/>
      </div>
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
      if (platform !== Const.PLATFORM.MOBILE && platform !== Const.PLATFORM.CRX) {
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
