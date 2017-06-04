//
// Copyright 2017 Minder Labs.
//

import gql from 'graphql-tag';
import React from 'react';

import { Fragments } from 'alien-api';

import { Card } from '../../../components/card';

import { QueryItem } from '../item_container';

/**
 * Project card.
 */
export class ProjectCard extends React.Component {

  render() {
    let { item } = this.props;

    return (
      <Card item={ item }>
        Project
      </Card>
    );
  }
}

const ProjectItemQuery = gql`
  query ProjectItemQuery($key: KeyInput!) {
    item(key: $key) {
      ...ItemFragment
      ...ProjectFragment
    }
  }

  ${Fragments.ItemFragment}  
  ${Fragments.ProjectFragment}  
`;

export const ProjectCardContainer = QueryItem(ProjectItemQuery)(ProjectCard);
