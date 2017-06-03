//
// Copyright 2017 Minder Labs.
//

import { compose } from 'react-apollo';
import gql from 'graphql-tag';

import { Fragments } from 'alien-api';

import { Card } from '../../components/card';

import { Connector } from './connector';

const ItemQuery = gql`
  query ItemQuery($key: KeyInput!) {
    item(key: $key) {
      ...ItemFragment
    }
  }

  ${Fragments.ItemFragment}  
`;

export const CardContainer = compose(Connector.itemQuery(ItemQuery))(Card);
