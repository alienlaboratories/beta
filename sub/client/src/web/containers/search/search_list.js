//
// Copyright 2017 Minder Labs.
//

import React from 'react';
import PropTypes from 'prop-types';

import { SubscriptionWrapper } from '../../util/subscriptions';
import { Card } from '../../components/card';
import { List, ListItem } from '../../components/list';

import { SearchQuery, SearchContainer } from './search_container';

//-------------------------------------------------------------------------------------------------
// Simple search list.
//-------------------------------------------------------------------------------------------------

const CustomColumn = ListItem.createInlineComponent((props, context) => {
  let { item } = context;
  let { typeRegistry } = props;

  let Column = typeRegistry.column(item.type);

  return (
    <div>
      { Column &&
        <Column item={ item }/>
      }
    </div>
  );
});

/**
 * NOTE: Depends on ItemFragment fields.
 */
export const ListItemRenderer = (typeRegistry) => (item) => {
  return (
    <ListItem item={ item }>
      <ListItem.Favorite/>
      <ListItem.Text value={ item.title } select={ true }/>

      <CustomColumn typeRegistry={ typeRegistry }/>

      <div className="ux-icons">
        <div className="ux-no-hover">
          <ListItem.Icon icon={ item.iconUrl || typeRegistry.icon(item.type) }/>
        </div>
        <div className="ux-hover">
          <ListItem.DeleteButton/>
        </div>
      </div>
    </ListItem>
  );
};

/**
 * Debug.
 */
export const DebugListItemRenderer = (item) => {
  return (
    <ListItem item={ item } className="ux-column">
      <ListItem.Debug/>
    </ListItem>
  );
};

/**
 * Simple List.
 */
export class SearchList extends React.Component {

  static contextTypes = {
    typeRegistry: PropTypes.object.isRequired,
    navigator: PropTypes.object.isRequired,
    mutator: PropTypes.object.isRequired
  };

  handleItemSelect(item) {
    this.context.navigator.pushCanvas(item);
  }

  render() {
    let { typeRegistry, items } = this.props;

    // TODO(burdon): Handle mutations (e.g., labels).
    // TODO(burdon): Warning if no mutation callback provided.

    return (
      <div className="ux-search-list-container ux-panel ux-column ux-grow">
        <List items={ items }
//            itemRenderer={ DebugListItemRenderer }
              itemRenderer={ ListItemRenderer(typeRegistry) }
              className="ux-search-list ux-grow"
              highlight={ true }
              onItemSelect={ this.handleItemSelect.bind(this) }/>
      </div>
    );
  }
}

export const SearchListContainer = SearchContainer(SearchQuery)(SubscriptionWrapper(SearchList));

//-------------------------------------------------------------------------------------------------
// Card list.
//-------------------------------------------------------------------------------------------------

/**
 * Card deck.
 */
export class CardList extends React.Component {

  static contextTypes = {
    navigator: PropTypes.object.isRequired,
    mutator: PropTypes.object.isRequired
  };

  handleItemSelect(item) {
    this.context.navigator.pushCanvas(item);
  }

  render() {
    let { items } = this.props;

    // TODO(burdon): Handle mutations (e.g., labels).
    // TODO(burdon): Warning if no mutation callback provided.

    return (
      <div className="ux-card-deck ux-panel ux-column ux-grow">
        <List items={ items }
              itemRenderer={ Card.ItemRenderer }
              className="ux-grow"
              onItemSelect={ this.handleItemSelect.bind(this) }/>
      </div>
    );
  }
}

export const CardDeckContainer = SearchContainer(SearchQuery)(SubscriptionWrapper(CardList));
