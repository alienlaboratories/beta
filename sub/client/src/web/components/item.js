//
// Copyright 2017 Alien Labs.
//

import React from 'react';
import PropTypes from 'prop-types';

import { MutationUtil } from 'alien-core';

import { ReactUtil } from '../util/react';

import { Canvas } from './canvas';
import { Card } from './card';
import { TextBox } from './textbox';

/**
 * Card
 */
export class ItemCard extends React.Component {

  static propTypes = {
    item: PropTypes.object.isRequired
  };

  render() {
    let { item } = this.props;

    let className = 'ux-type-' + item.type.toLowerCase();

    return (
      <Card className={ className } item={ item }/>
    );
  }
}

/**
 * Canvas.
 */
export class ItemCanvasComponent extends React.Component {

  static propTypes = {
    refetch: PropTypes.func.isRequired,
    item: PropTypes.object
  };

  render() {
    return ReactUtil.render(this, () => {
      let { item, refetch } = this.props;

      return (
        <Canvas item={ item } refetch={ refetch }/>
      );
    });
  }
}

/**
 * Canvas Header.
 */
export class ItemCanvasHeaderComponent extends React.Component {

  static contextTypes = {
    mutator: PropTypes.object.isRequired
  };

  static propTypes = {
    onSave: PropTypes.func.isRequired,
    toolbar: PropTypes.object
  };

  handleSave() {
    this.props.onSave();
  }

  handleUpdate(title) {
    let { mutator } = this.context;
    let { item } = this.props;

    if (title !== item.title) {
      mutator.batch(item.bucket).updateItem(item, [
        MutationUtil.createFieldMutation('title', 'string', title)
      ]).commit();
    }
  }

  render() {
    return ReactUtil.render(this, () => {
      let { item, toolbar } = this.props;
      let { title } = item;

      return (
        <div className="ux-row ux-grow">

          <div className="ux-navbar-buttons">
            <div>
              <i className="material-icons ux-icon ux-icon-action" onClick={ this.handleSave.bind(this) }>save</i>
            </div>
          </div>

          <div className="ux-navbar-buttons">
            { toolbar }
          </div>

          <div className="ux-title ux-grow">
            <TextBox value={ title }
                     className="ux-grow"
                     placeholder="Title"
                     notEmpty={ true }
                     clickToEdit={ true }
                     onEnter={ this.handleUpdate.bind(this) }/>
          </div>

        </div>
      );
    }, false);
  }
}
