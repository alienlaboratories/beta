//
// Copyright 2017 Minder Labs.
//

import gql from 'graphql-tag';

//-------------------------------------------------------------------------------------------------
// GQL Queries and Mutations.
//-------------------------------------------------------------------------------------------------

export const ProjectsQuery = gql`
  query ProjectsQuery($filter: FilterInput) {
    search(filter: $filter) {
      items {
        bucket
        type
        id
        title
        labels
        
        ... on Project {
          group {
            id
            title
          }

          tasks {
            bucket
            type
            id
            title
          }
        }
      }
    }
  }
`;

export const UpsertItemsMutation = gql`
  mutation UpsertItemsMutation($mutations: [ItemMutationInput]!) {
    upsertItems(mutations: $mutations) {
<<<<<<< HEAD
      
      status
      
#      bucket
#      type
#      id
#      title
#      
#      ... on Project {
#        tasks {
#          id
#        }
#      }
=======
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
>>>>>>> 6f003e81846022966fd79b3a8012409502d9e1ca
    }
  }
`;

export const ProjectsQueryName        = _.get(ProjectsQuery,        'definitions[0].name.value');
export const UpsertItemsMutationName  = _.get(UpsertItemsMutation,  'definitions[0].name.value');
