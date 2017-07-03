//
// Copyright 2017 Alien Labs.
//

import gql from 'graphql-tag';

import { FragmentsMap } from 'alien-core';

//
// All sub-types should include the Item fragment.
//

export const ValueFragment = gql`
  fragment ValueFragment on Value {
    null
    int
    float
    string
    boolean
    id
    timestamp
    date
  }
`;

const KeyFragment = gql`
  fragment KeyFragment on Item {
    namespace
    bucket
    type
    id
  }
`;

const MetaFragment = gql`
  fragment MetaFragment on Meta {
    icon
    iconClassName
    thumbnailUrl
  }
`;

const ItemFragment = gql`
  fragment ItemFragment on Item {
    namespace
    bucket
    type
    id
    version

    fkey
    alias

    created
    modified
    
    labels
    title
    description

    meta {
      ...MetaFragment
    }
  }
  
  ${MetaFragment}
`;

//
// TODO(burdon): Try getting type from inline spread? (rather than def per sub-type).
//

const ListItemMetaFragment = gql`
  fragment ListItemMetaFragment on ListItemMeta {
    itemId
    listId
    order
  }
`;

const BoardFragment = gql`
  fragment BoardFragment on Board {
    alias
    filter
    title
    icon

    columns {
      id
      title
      value {
        ...ValueFragment
      }
    }

    itemMeta {
      ...ListItemMetaFragment
    }
  }
  
  ${ValueFragment}
  ${ListItemMetaFragment}
`;

//
// Item Type fragments.
//
// WARNING: "undefined" Compile error if not acyclic.
//

const DocumentFragment = gql`
  fragment DocumentFragment on Document {
    ...ItemFragment

    externalUrl  
  }

  ${ItemFragment}
`;

const GroupFragment = gql`
  fragment GroupFragment on Group {
    ...ItemFragment

    whitelist

    members {
      ...ItemFragment
      email
    }

    projects {
      ...ItemFragment
    }
  }

  ${ItemFragment}
`;

const TaskFragment = gql`
  fragment TaskFragment on Task {
    ...ItemFragment

    status
    
    project {
      ...ItemFragment

      group {
        ...KeyFragment
      }
    }

    owner {
      ...ItemFragment
    }

    assignee {
      ...ItemFragment
    }

    # NOTE: ProjectFragment selects full TaskFragments, but we need to declare keys here, 
    # so that the queries fragment is a super-set of the mutation fragment below.
    tasks {
      ...KeyFragment
    }
  }

  ${KeyFragment}
  ${ItemFragment}
`;

const NestedTasksFragment = gql`
  fragment NestedTasksFragment on Task {
    ...TaskFragment

    tasks {
      ...TaskFragment
    }
  }

  ${TaskFragment}
`;

const ContactFragment = gql`
  fragment ContactFragment on Contact {
    ...ItemFragment
    
    email

    messages {
      ...ItemFragment
    }
    
    tasks {
      ...TaskFragment
    }
  }
  
  ${ItemFragment}
  ${TaskFragment}
`;

const ProjectFragment = gql`
  fragment ProjectFragment on Project {
    ...ItemFragment

    group {
      ...GroupFragment
    }

    tasks {
      ...NestedTasksFragment
    }
  }

  ${KeyFragment}
  ${ItemFragment}
  ${GroupFragment}
  ${NestedTasksFragment}
`;

const UserFragment = gql`
  fragment UserFragment on User {
    ...ItemFragment
    email

    ownerTasks: tasks(filter: { expr: { field: "owner", ref: "id" } }) {
      ...TaskFragment
    }

    assigneeTasks: tasks(filter: { expr: { field: "assignee", ref: "id" } }) {
      ...TaskFragment
    }
  }

  ${ItemFragment}
  ${TaskFragment}
`;

//
// Union of Item fragments for search.
//

const SearchItemFragment = gql`
  fragment SearchItemFragment on Item {
    ...ItemFragment
    ...ContactFragment
    ...DocumentFragment
    ...ProjectFragment
    ...NestedTasksFragment
  }

  ${ItemFragment}
  ${ContactFragment}
  ${DocumentFragment}
  ${ProjectFragment}
  ${NestedTasksFragment}
`;

//
// Compound types.
//

const ProjectBoardFragment = gql`
  fragment ProjectBoardFragment on Project {
    boards {
      ...BoardFragment

# NOTE: Must match query fragments.
#      items {
#        ...SearchItemFragment
#      }
    }
  }

  ${BoardFragment}
`;

// ${SearchItemFragment}

//
// Exported fragment defs.
//

export const Fragments = {

  // Framework.

  ItemFragment,
  SearchItemFragment,

  // Types

  ContactFragment,
  DocumentFragment,
  GroupFragment,
  ProjectFragment,
  ProjectBoardFragment,
  TaskFragment,

  // System

  UserFragment,
};

//
// Mutaton fragments define the __subset__ of fields (from query fragments) that can be mutated.
// In particular, only Keys are declared for sub Items; this enables references to be added in field mutations
// so that Apollo can use `dataIdFromObject` to match the associated Item. Otherwise there would be
// "Missing field" warnings when writing the (partial) fragment to the cache (in the batch update).
//
// NOTE: Mutation fragments must match query fragments otherwise null is returned after the mutation.
// https://github.com/apollographql/apollo-client/issues/1830
//

const ContactMutationFragment = gql`
  fragment ContactMutationFragment on Contact {
    ...ItemFragment

    email

    messages {
      ...KeyFragment
    }

    tasks {
      ...KeyFragment
    }
  }

  ${KeyFragment}
  ${ItemFragment}
`;

const ProjectMutationFragment = gql`
  fragment ProjectMutationFragment on Project {
    ...ItemFragment

    tasks {
      ...KeyFragment
    }
    
    boards {
      ...BoardFragment
    }
  }

  ${KeyFragment}
  ${ItemFragment}
  ${BoardFragment}
`;

const TaskMutationFragment = gql`
  fragment TaskMutationFragment on Task {
    ...ItemFragment

    status
    
    project {
      ...KeyFragment
    }

    owner {
      ...KeyFragment
    }

    assignee {
      ...KeyFragment
    }

    tasks {
      ...KeyFragment
    }
  }

  ${KeyFragment}
  ${ItemFragment}
`;

export const MutationFragmentsMap = new FragmentsMap()
  .add(ContactMutationFragment)
  .add(ProjectMutationFragment)
  .add(TaskMutationFragment);
