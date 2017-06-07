//
// Copyright 2017 Alien Labs.
//

import React from 'react';
import PropTypes from 'prop-types';

import { DomUtil, TypeUtil } from 'alien-util';

import { ReactUtil } from '../util/react';

import './card.less';

const CarcChildContextTypes = {
  item: PropTypes.object,
  setSectionState: PropTypes.func.isRequired
};

/**
 * Card wrapper.
 */
export class Card extends React.Component {

  /**
   * Map of state objects indexed by item id.
   * @type {Map} <{ID}:{ID:{ closed }}>
   */
  static state = new Map();

  /**
   * Type-specific card renderer.
   */
  static ItemRenderer = (typeRegistry, mutator, viewer) => ({ item }) => {
    let CardComponent = typeRegistry && typeRegistry.card(item.type) || Card;

    return <CardComponent item={ item } mutator={ mutator } viewer={ viewer }/>;
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
    className: PropTypes.string,
    item: PropTypes.object,
    icon: PropTypes.string
  };

  static contextTypes = {
    config: PropTypes.object,
    navigator: PropTypes.object
  };

  static childContextTypes = CarcChildContextTypes;

  static createInlineComponent(render) {
    render.contextTypes = CarcChildContextTypes;
    return render;
  }

  getChildContext() {
    return {
      item: this.props.item,
      setSectionState: this.setSectionState.bind(this)
    };
  }

  setSectionState(key, value) {
    console.log(key, value);
    let { item } = this.props;
    let state = TypeUtil.defaultMap(Card.state, item.id, Object);
    _.set(state, key, value);
    this.forceUpdate();
  }

  handleSelect(item) {
    let { navigator } = this.context;

    navigator && navigator.pushCanvas(item);
  }

  render() {
    return ReactUtil.render(this, () => {
      let { config } = this.context;
      let { children, className, debug=true, item, icon } = this.props;
      if (!item) {
        return;
      }

      let { title, description, modified } = item;

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

      // TODO(burdon): Edit-in-place title.

      return (
        <div className={ DomUtil.className('ux-card', className) }>

          {/* Header */}
          <div className="ux-card-header">
            { icon && <i className="ux-icon">{ icon }</i> }

            <h1 className="ux-text-noselect ux-press"
                onClick={ this.handleSelect.bind(this, item) }>{ title }</h1>

            <i className="ux-icon ux-icon-menu"/>
          </div>

          {/* Main */}
          <div className="ux-card-main">

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
            <span>{ modified }</span>
          </div>
        </div>
      );
    });
  }
}
