//
// Copyright 2017 Alien Labs.
//

import gql from 'graphql-tag';

import { FragmentsMap, FragmentParser } from './schema';

const TestMetaFragment = gql`
  fragment TestMetaFragment on Meta {
    icon
    thumbnailUrl
  }
`;

const TestItemFragment1 = gql`
  fragment TestItemFragment1 on Item {
    type
    id
    
    meta {
      ...TestMetaFragment
    }
  }
  
  ${TestMetaFragment}
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

test('Create fragment map.', () => {
  const fragmentsMap = new FragmentsMap()
    .add(TestItemFragment1)
    .add(TestItemFragment2)
    .add(TestProjectFragment1)
    .add(TestProjectFragment2);

  let fragments = fragmentsMap.getFragments('Project');
  expect(fragments).toHaveLength(2);
});

test('Create null object.', () => {

  let parser = new FragmentParser(TestProjectFragment1);

  let item = parser.getDefaultObject({ type: 'test', meta: { icon: 'test' } });

  expect(item).toEqual({
    __typename: 'Project',
    type: 'test',
    id: null,

    meta: {
      __typename: 'Meta',
      icon: 'test',
      thumbnailUrl: null
    },

    title: null,

    labels: null,
    tasks: null
  });
});
