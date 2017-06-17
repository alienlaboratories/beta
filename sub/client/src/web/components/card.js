//
// Copyright 2017 Alien Labs.
//

import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';

import { DomUtil, TypeUtil } from 'alien-util';
import { ID, MutationUtil } from 'alien-core';

import { ReactUtil } from '../util/react';

import { TextBox } from '../components/textbox';
import { LabelPicker } from '../components/labels';
import { MenuBar, MenuPanel, MenuItem } from '../components/menu';

import { Canvas } from './canvas';

import './card.less';

const CardChildContextTypes = {
  item:             PropTypes.object,
  setSectionState:  PropTypes.func.isRequired
};

/**
 * Canvas wrapper for cards.
 * @param Card
 * @constructor
 */
export const CardCanvas = (Card) => (props) => {
  return (
    <Canvas className="ux-card-deck">
      <Card { ...props }/>
    </Canvas>
  );
};

/**
 * Card wrapper.
 */
export class Card extends React.Component {

  // TODO(burdon): Only allow delete if Task and part of project?
  static MENU_PANEL = (
    <MenuPanel>
      <MenuItem value="delete">Delete card</MenuItem>
    </MenuPanel>
  );

  /**
   * Map of state objects indexed by item id.
   * @type {Map} <{ID}:{ID:{ closed }}>
   */
  static state = new Map();

  /**
   * Type-specific card renderer.
   */
  static ItemRenderer = (typeRegistry, mutator, viewer) => ({ item, readOnly }) => {
    console.assert(typeRegistry && mutator && viewer);
    let CardComponent = typeRegistry && typeRegistry.card(item.type) || Card;

    return <CardComponent item={ item } mutator={ mutator } viewer={ viewer } readOnly={ readOnly }/>;
  };

  /**
   * Card section.
   */
  static Section = Card.createInlineComponent((props, context) => {
    let { item, setSectionState } = context;
    let { id, title, children, open=true } = props;

    let key = 'open.' + id;
    let state = TypeUtil.defaultMap(Card.state, item.id, Object);
    open = _.get(state, key, open);

    let header;
    if (title) {
      console.assert(id);
      const onClick = () => {
        setSectionState(key, !open);
      };

      header = (
        <div className="ux-card-section-header">
          <h2 onClick={ onClick }>{ title }</h2>
          <i className={ DomUtil.className('ux-icon', 'ux-icon-toggle', open && 'ux-open') } onClick={ onClick }/>
        </div>
      );
    }

    let body = children;
    if (header) {
      body = (
        <div>
          { children }
        </div>
      );
    }

    return (
      <div className="ux-card-section">
        { header }
        { open && body }
      </div>
    );
  });

  static propTypes = {
    mutator:      PropTypes.object.isRequired,
    viewer:       PropTypes.object.isRequired,
    className:    PropTypes.string,
    item:         PropTypes.object,
    icon:         PropTypes.string,
    showLabels:   PropTypes.bool
  };

  static contextTypes = {
    config:       PropTypes.object,
    navigator:    PropTypes.object
  };

  static childContextTypes = CardChildContextTypes;

  static createInlineComponent(render) {
    render.contextTypes = CardChildContextTypes;
    return render;
  }

  getChildContext() {
    return {
      item: this.props.item,
      setSectionState: this.setSectionState.bind(this)
    };
  }

  setSectionState(key, value) {
    let { item } = this.props;
    let state = TypeUtil.defaultMap(Card.state, item.id, Object);
    _.set(state, key, value);
    this.forceUpdate();
  }

  handleSelect() {
    let { navigator } = this.context;
    let { item } = this.props;

    navigator && navigator.pushCanvas(item);
  }

  handleEdit(field, value) {
    let { mutator, viewer: { groups }, item } = this.props;

    mutator
      .batch(groups, item.bucket)
      .updateItem(item, [
        MutationUtil.createFieldMutation(field, 'string', value)
      ])
      .commit();
  }

  handleDelete() {
    let { mutator, viewer: { groups }, item } = this.props;

    let batch = mutator
      .batch(groups, item.bucket)
      .updateItem(item, [
        MutationUtil.createDeleteMutation()
      ]);

    // TODO(burdon): Hack. Delegate (via context) to parent canvas since type-specific.
    if (item.project) {
      batch.updateItem(item.project, [
        MutationUtil.createSetMutation('tasks', 'key', ID.key(item), false)
      ]);
    }

    batch.commit();
  }

  handleLabelUpdate(label, add) {
    let { mutator, viewer: { groups }, item } = this.props;

    mutator
      .batch(groups, item.bucket)
      .updateItem(item, [
        MutationUtil.createSetMutation('labels', 'string', label, add)
      ])
      .commit();
  }

  handleMenuSelect(value) {
    switch (value) {
      case 'delete': {
        return this.handleDelete();
      }
    }
  }

  render() {
    return ReactUtil.render(this, () => {
      let { config } = this.context;
      let { children, className, debug, item, icon, readOnly, showLabels=false } = this.props;
      if (!item) {
        return;
      }

      let { labels, title, description, modified } = item;

      //
      // Debug.
      //

      let debugSection;
      if (debug || _.get(config, 'options.debugInfo')) {
        debugSection = (
          <Card.Section id="debug" item={ item } title="Debug" open={ false }>
            <pre className="ux-card-padding ux-debug" title={ JSON.stringify(_.pick(item, ['namespace', 'bucket'])) }>
              { TypeUtil.stringify(item, 2) }
            </pre>
          </Card.Section>
        );
      }

      return (
        <div className={ DomUtil.className('ux-card', className) }>

          {/* Header */}
          <MenuBar className="ux-card-header" panel={ Card.MENU_PANEL } onSelect={ this.handleMenuSelect.bind(this) }>
            { icon && <i className="ux-icon">{ icon }</i> }

            { readOnly ?

            <div className="ux-title ux-grow"
                 onClick={ this.handleSelect.bind(this) }>{ title }</div> :

            <TextBox className="ux-title ux-grow"
                     value={ title }
                     clickToEdit={ !readOnly }
                     onEnter={ this.handleEdit.bind(this, 'title') }/>
            }

          </MenuBar>

          {/* Main */}
          <div className="ux-card-main">

            { showLabels &&
            <Card.Section id="labels">
              <LabelPicker labels={ labels || [] } onUpdate={ this.handleLabelUpdate.bind(this) }/>
            </Card.Section>
            }

            {/* TODO(burdon): Make extensible. */}
            { description &&
            <Card.Section id="details" title="Details">
              <div className="ux-card-padding">
                <div className="ux-font-small">{ description }</div>
              </div>
            </Card.Section>
            }

            {/* Type-specific */}
            { children }

            {/* Debug */}
            { debugSection }
          </div>

          {/* Footer */}
          <div className="ux-card-footer">
            <span>Updated { moment(modified * 1000).calendar() }</span>
          </div>
        </div>
      );
    });
  }
}
