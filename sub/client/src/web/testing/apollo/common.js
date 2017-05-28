//
// Copyright 2017 Minder Labs.
//

import gql from 'graphql-tag';

import { Fragments } from 'alien-core';

//-------------------------------------------------------------------------------------------------
// GQL Queries and Mutations.
//-------------------------------------------------------------------------------------------------

// TODO(burdon): Fragments don't work here!!!!!!!!!!!!!!!
// TODO(burdon): Define Fragments for each type.

export const SearchQuery = gql`
  query SearchQuery($filter: FilterInput) {
    search(filter: $filter) {
      items {
        ...ItemFragment
        id
        title

        ... on Project {
          group {
            id
            title
          }

          tasks {
            ...ItemFragment
            id
            title
          }
        }
      }
    }
  }
  
  ${Fragments.ItemFragment}
`;

export const UpsertItemsMutation = gql`
  mutation UpsertItemsMutation($itemMutations: [ItemMutationInput]!) {
    upsertItems(itemMutations: $itemMutations) {
      bucket
      type
      id
      title
      labels

      ... on Project {
        tasks {
          id                # This is enough for Apollo to reconcile the ID with the item.
        }
      }
    }
  }
`;

// export const UpsertItemsMutation = gql`
//   mutation UpsertItemsMutation($mutations: [ItemMutationInput]!) {
//     upsertItems(mutations: $mutations) {
//       status
//     }
//   }
// `;

export const SearchQueryName          = _.get(SearchQuery,          'definitions[0].name.value');
export const UpsertItemsMutationName  = _.get(UpsertItemsMutation,  'definitions[0].name.value');
