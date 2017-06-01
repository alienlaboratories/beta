//
// Copyright 2017 Alien Labs.
//

import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'react-apollo';
import gql from 'graphql-tag';

// TODO(burdon): Remove.
import { MutationUtil } from 'alien-core';
import { TextBox } from '../components/textbox';

import { Fragments } from 'alien-api';

import { ReactUtil } from '../util/react';

import { Connector } from './connector';

/**
 * Type-specific query.
 */
const ItemQuery = gql`
  query ItemQuery($key: KeyInput!) {
    item(key: $key) {
      ...ItemFragment
    }
  }

  ${Fragments.ItemFragment}  
`;

export const ItemCanvasHeader = compose(
  Connector.connect(Connector.itemQuery(ItemQuery))
)(ItemCanvasHeaderComponent);

/**
 * Canvas Header.
 */
export class ItemCanvasHeaderComponent extends React.Component {

  static contextTypes = {
    // TODO(burdon): Callback.
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
      // TODO(burdon): Callback.
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

          <div className="ux-nav-bar-buttons">
            <div>
              <i className="ux-icon-save" onClick={ this.handleSave.bind(this) }/>
            </div>
          </div>

          <div className="ux-nav-bar-buttons">
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
