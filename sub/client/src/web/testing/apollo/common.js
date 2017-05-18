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

// TODO(burdon): Minimal GQL explorer app? D3?
// TODO(burdon): Remove local/global ID (encode only for URIs). change API to require type/ID (create Reference type)

// TODO(burdon): Document effect of just returning IDs for mutation (e.g., cache doesn't update field even if opt).
// TODO(burdon): Try this on main app and/or context setting to return IDs only (rather than object lookup).
// TODO(burdon): Is is necessary to return any information from the mutation (can opt result alone update store).
// TODO(burdon): Test against real server.

// TODO(burdon): Create ideas board for the following (and folder for grabs from movies, etc.)
// TODO(burdon): Canvas/stickies/lightboard; drag live cards. cards interact with surface. UX will drive product. Make it cool. Kumiko

export const UpsertItemsMutation = gql`
  mutation UpsertItemsMutation($mutations: [ItemMutationInput]!) {
    upsertItems(mutations: $mutations) {
      
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
    }
  }
`;

export const ProjectsQueryName        = _.get(ProjectsQuery,        'definitions[0].name.value');
export const UpsertItemsMutationName  = _.get(UpsertItemsMutation,  'definitions[0].name.value');
