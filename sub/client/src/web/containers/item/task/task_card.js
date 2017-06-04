//
// Copyright 2017 Minder Labs.
//

import gql from 'graphql-tag';
import React from 'react';

import { Fragments } from 'alien-api';

import { Card } from '../../../components/card';

import { QueryItem } from '../item_container';

/**
 * Task card.
 */
export class TaskCard extends React.Component {

  render() {
    let { item } = this.props;

    return (
      <Card item={ item }>
        Task
      </Card>
    );
  }
}

const TaskItemQuery = gql`
  query TaskItemQuery($key: KeyInput!) {
    item(key: $key) {
      ...ItemFragment
      ...TaskFragment
    }
  }

  ${Fragments.ItemFragment}  
  ${Fragments.TaskFragment}  
`;

export const TaskCardContainer = QueryItem(TaskItemQuery)(TaskCard);
