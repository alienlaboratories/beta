//
// Copyright 2017 Alien Labs.
//

import React from 'react';
import { compose } from 'react-apollo';
import gql from 'graphql-tag';

import { ItemReducer, Fragments } from 'alien-util';

import { connectReducer } from '../framework/connector';
import { ItemCanvasComponent, ItemCanvasHeaderComponent } from '../components/item';

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

export const ItemCanvas = compose(
  connectReducer(ItemReducer.graphql(ItemQuery))
)(ItemCanvasComponent);

export const ItemCanvasHeader = compose(
  connectReducer(ItemReducer.graphql(ItemQuery))
)(ItemCanvasHeaderComponent);
