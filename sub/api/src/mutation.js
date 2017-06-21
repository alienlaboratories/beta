//
// Copyright 2017 Alien Labs.
//

import _ from 'lodash';
import gql from 'graphql-tag';

export const BatchMutation = gql`
  mutation BatchMutation($itemMutations: [ItemMutationInput]!) {
    batchMutation(itemMutations: $itemMutations) {
      keys {
        bucket
        type
        id
      }
    }
  }
`;

export const BatchMutationName = // 'BatchMutation'
  _.get(BatchMutation, 'definitions[0].name.value');

export const BatchMutationPath = // 'batchMutation'
  _.get(BatchMutation, 'definitions[0].selectionSet.selections[0].name.value');
