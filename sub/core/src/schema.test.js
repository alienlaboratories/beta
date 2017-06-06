//
// Copyright 2017 Alien Labs.
//

import gql from 'graphql-tag';

import { FragmentsMap } from './schema';

const TestItemFragment1 = gql`
  fragment TestItemFragment1 on Item {
    type
    id
    meta {
      icon
    }
  }
`;

const TestItemFragment2 = gql`
  fragment TestItemFragment2 on Item {
    title
  }
`;

const TestProjectFragment1 = gql`  
  fragment TestProjectFragment1 on Project {
    ...TestItemFragment1
    ...TestItemFragment2
    
    labels

    tasks {
      ...TestItemFragment1
    }
  }

  ${TestItemFragment1}
  ${TestItemFragment2}
`;

const TestProjectFragment2 = gql`  
  fragment TestProjectFragment2 on Project {
    ...TestItemFragment1

    boards {
      alias
    }
  }

  ${TestItemFragment1}
`;

test('Create null object', () => {
  let fragmentMap = new FragmentsMap()
    .add(TestItemFragment1)
    .add(TestItemFragment2)
    .add(TestProjectFragment1)
    .add(TestProjectFragment2);

  let item = fragmentMap.getDefaultObject('Project');

  expect(item).toEqual({
    __typename: 'Project',
    type: null,
    id: null,
    meta: null,
    title: null,
    labels: null,
    tasks: null,
    boards: null
  });
});
