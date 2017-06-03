//
// Copyright 2017 Minder Labs.
//

import React from 'react';
import PropTypes from 'prop-types';

import { SubscriptionWrapper } from '../../util/subscriptions';
import { List, ListItem } from '../../components/list';

import { SearchQuery, SearchContainer } from './search_container';

//-------------------------------------------------------------------------------------------------
// List renderers.
//-------------------------------------------------------------------------------------------------

const CustomIcon = ListItem.createInlineComponent((props, context) => {
  let { item } = context;
  let { typeRegistry } = props;

  return (
    <ListItem.Icon icon={ item.iconUrl || typeRegistry.icon(item.type) }/>
  );
});

const CustomColumn = ListItem.createInlineComponent((props, context) => {
  let { item } = context;
  let { typeRegistry } = props;

  let Column = typeRegistry.column(item.type);

  return (
    <div className="ux-noshrink">
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
      <div className="ux-icons ux-noshrink">
        <CustomIcon typeRegistry={ typeRegistry }/>
        <ListItem.DeleteButton/>
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
