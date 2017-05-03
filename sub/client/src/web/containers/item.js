//
// Copyright 2017 Alien Labs.
//

import { compose } from 'react-apollo';
import gql from 'graphql-tag';

import { Fragments } from 'alien-core';

import { ItemCanvasComponent, ItemCanvasHeaderComponent } from '../components/item';

import { Connector } from './connector';

/**
 * Type-specific query.
 */
const ItemQuery = gql`
  query ItemQuery($itemId: ID!) {
    item(itemId: $itemId) {
      ...ItemFragment
    }
  }

  ${Fragments.ItemFragment}  
`;

// TODO(burdon): Note used.
export const ItemCanvas = compose(
  Connector.connect(Connector.itemQuery(ItemQuery))
)(ItemCanvasComponent);

export const ItemCanvasHeader = compose(
  Connector.connect(Connector.itemQuery(ItemQuery))
)(ItemCanvasHeaderComponent);
