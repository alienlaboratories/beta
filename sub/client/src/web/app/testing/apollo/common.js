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
        }
      }
    }
  }
`;

export const TestQuery = gql`
  query TestQuery($filter: FilterInput) {
    search(filter: $filter) {
      items {
        bucket
        type
        id
        title
      }
    }
  }
`;

export const TestMutation = gql`
  mutation UpsertItemsMutation($mutations: [ItemMutationInput]!) {
    upsertItems(mutations: $mutations) {
      bucket
      type
      id
      title
    }
  }
`;

export const ProjectsQueryName  = _.get(ProjectsQuery,  'definitions[0].name.value');
export const TestQueryName      = _.get(TestQuery,      'definitions[0].name.value');
export const TestMutationName   = _.get(TestMutation,   'definitions[0].name.value');
