//
// Copyright 2017 Alien Labs.
//

import gql from 'graphql-tag';

import { FragmentsMap, ValueFragment } from 'alien-core';

//
// All sub-types should include the Item fragment.
//

const ItemFragment = gql`
  fragment ItemFragment on Item {
    namespace
    bucket
    type
    id
    version

    fkey
    alias

    labels
    title
    
    meta {
      icon
      iconUrl
      thumbnailUrl
    }
  }
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
    }

    owner {
      ...ItemFragment
    }

    assignee {
      ...ItemFragment
    }

    tasks {
      ...ItemFragment
      status
    }
  }

  ${ItemFragment}
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

    tasks {
      ...TaskFragment
    }
  }

  ${ItemFragment}
  ${TaskFragment}
`;

const ProjectBoardFragment = gql`
  fragment ProjectBoardFragment on Project {
    boards {
      alias

      columns {
        id
        title
        value {
          ...ValueFragment
        }
      }

      itemMeta {
        itemId
        listId
        order
      }
    }
  }

  ${ValueFragment}
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

const ItemMetaFragment = gql`
  fragment ItemMetaFragment on Item {
    ...ContactFragment
    ...DocumentFragment
    ...ProjectFragment
    ...TaskFragment
  }

  ${ContactFragment}
  ${DocumentFragment}
  ${ProjectFragment}
  ${TaskFragment}
`;

//
// Map of fragmentds to update on mutation.
//

export const MutationFragments = new FragmentsMap()
  .add(ItemFragment)
  .add(ContactFragment)
  .add(ProjectFragment)
  .add(TaskFragment);

//
// Exported fragment defs.
//

export const Fragments = {

  // Framework.

  ItemFragment,
  ItemMetaFragment,

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
