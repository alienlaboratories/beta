//
// Copyright 2017 Alien Labs.
//

import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'react-apollo';

import { SubscriptionWrapper } from '../../util/subscriptions';
import { Card } from '../../components/card';
import { List } from '../../components/list';
import { ListItem } from '../../components/list_item';

import { ContextQuery, ContextContainer } from './context_container';
import { SearchQuery, SearchContainer } from './search_container';

import './search_list.less';

//-------------------------------------------------------------------------------------------------
// Simple search list.
//-------------------------------------------------------------------------------------------------

const CustomColumn = ListItem.createInlineComponent((props, context) => {
  let { item } = context;
  let { typeRegistry } = props;

  let Column = typeRegistry.column(item.type);

  return Column ? <Column item={ item }/> : <div/>;
});

/**
 * NOTE: Depends on ItemFragment fields.
 */
export const ListItemRenderer = (typeRegistry) => ({ item }) => {
  let { meta } = item;
  let { icon, iconClassName } = meta || {};

  return (
    <ListItem item={ item }>
      <ListItem.Favorite/>
      <ListItem.Text field="title" select={ true }/>

      <CustomColumn typeRegistry={ typeRegistry }/>

      <div className="ux-icons">
        <div className="ux-no-hover">
          <ListItem.Icon icon={ !iconClassName && (typeRegistry.icon(item.type) || icon) }
                         className={ iconClassName }/>
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
export const DebugListItemRenderer = ({ item }) => {
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

  // TODO(burdon): Remove dependency on context (or use consistently).

  static contextTypes = {
    typeRegistry: PropTypes.object.isRequired,
    navigator: PropTypes.object.isRequired,
    mutator: PropTypes.object.isRequired,
    viewer: PropTypes.object.isRequired
  };

  constructor() {
    super(...arguments);

//  this._itemRenderer = DebugListItemRenderer;
    this._itemRenderer = ListItemRenderer(this.context.typeRegistry);
  }

  handleItemSelect(item) {
    this.context.navigator.pushCanvas(item);
  }

  handleItemUpdate(item, mutations) {
    let { mutator, viewer: { groups } } = this.context;

    mutator
      .batch(groups)
      .updateItem(item, mutations)
      .commit();
  }

  render() {
    let { items } = this.props;

    return (
      <div className="ux-search-list ux-panel ux-column ux-grow">
        <List items={ items }
              itemRenderer={ this._itemRenderer }
              highlight={ true }
              onItemSelect={ this.handleItemSelect.bind(this) }
              onItemUpdate={ this.handleItemUpdate.bind(this) }/>
      </div>
    );
  }
}

//-------------------------------------------------------------------------------------------------
// Card list.
//-------------------------------------------------------------------------------------------------

/**
 * Card deck.
 */
export class CardList extends React.Component {

  static contextTypes = {
    typeRegistry: PropTypes.object.isRequired,
    navigator: PropTypes.object.isRequired,
    mutator: PropTypes.object.isRequired,
    viewer: PropTypes.object.isRequired
  };

  constructor() {
    super(...arguments);

    let { mutator, viewer } = this.context;
    this._itemRenderer = Card.ItemRenderer(this.context.typeRegistry, mutator, viewer);
  }

  handleItemSelect(item) {
    this.context.navigator.pushCanvas(item);
  }

  render() {
    let { items, itemInjector } = this.props;

    // TODO(burdon): Avoid merging here? (Move to Redux?)
    if (itemInjector) {
      items = itemInjector(items);
    }

    return (
      <div className="ux-card-deck ux-column ux-grow">
        <List items={ items }
              itemRenderer={ this._itemRenderer }
              onItemSelect={ this.handleItemSelect.bind(this) }/>
      </div>
    );
  }
}

//-------------------------------------------------------------------------------------------------
// Combined HOC.
//-------------------------------------------------------------------------------------------------

const SearchContextContainer = compose(
  ContextContainer(ContextQuery),
  SearchContainer(SearchQuery)
);

export const SearchListContainer = SearchContextContainer(SubscriptionWrapper(SearchList));

export const CardDeckContainer = SearchContextContainer(SubscriptionWrapper(CardList));
