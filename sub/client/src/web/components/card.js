//
// Copyright 2017 Alien Labs.
//

import React from 'react';
import PropTypes from 'prop-types';

import { DomUtil, TypeUtil } from 'alien-util';

import { ReactUtil } from '../util/react';

import './card.less';

/**
 * Card wrapper.
 */
export class Card extends React.Component {

  /**
   * Default renderer.
   */
  static ItemRenderer = (item) => {
    return <Card item={ item }/>;
  };

  static propTypes = {
    className: PropTypes.string,
    item: PropTypes.object,
    icon: PropTypes.string
  };

  static contextTypes = {
    config: PropTypes.object,
    navigator: PropTypes.object
  };

  state = {
    closed: new Map()
  };

  handleSelect(item) {
    let { navigator } = this.context;

    navigator && navigator.pushCanvas(item);
  }

  render() {
    return ReactUtil.render(this, () => {
      let { config } = this.context;
      let { children, className, item, icon } = this.props;
      if (!item) {
        return;
      }

      let { title, description, modified } = item;

      //
      // Section.
      //

      const Section = ({ id, title, children }) => {
        let open = !this.state.closed.get(id);

        let onClick = () => {
          this.state.closed.set(id, open);
          this.setState({
            closed: this.state.closed
          });
        };

        return (
          <div className="ux-card-section">
            <div className="ux-card-section-header">
              <h2>{ title }</h2>
              <i className={ DomUtil.className('ux-icon', 'ux-icon-toggle', open && 'ux-open') } onClick={ onClick }/>
            </div>

            { open &&
            <div>
              { children }
            </div>
            }
          </div>
        );
      };

      //
      // Debug.
      //

      let debug;
      if (_.get(config, 'options.debugInfo')) {
        let debugStr = TypeUtil.stringify(_.pick(item, ['bucket', 'type', 'id']), false) +
          (item.namespace ? ` [${item.namespace[0].toUpperCase()}]` : '') +
          (item.labels ? ` ${JSON.stringify(item.labels)}` : '');

        debug = (
          <div className="ux-card-section">
            <div className="ux-card-padding ux-debug" title={ JSON.stringify(_.pick(item, ['namespace', 'bucket'])) }>
              { debugStr }
            </div>
          </div>
        );
      }

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

            {/* Standard */}
            { description &&
            <Section id="details" title="Details">
              <div className="ux-card-padding">
                <div className="ux-font-small">{ description }</div>
              </div>
            </Section>
            }

            {/* Type-specific */}
            { children }

            {/* Debug */}
            { debug }
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
