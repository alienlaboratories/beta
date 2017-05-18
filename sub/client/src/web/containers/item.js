//
// Copyright 2017 Alien Labs.
//

import { compose } from 'react-apollo';
import gql from 'graphql-tag';

import { Fragments } from 'alien-core';

import { ItemCanvasHeaderComponent } from '../components/item';

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
