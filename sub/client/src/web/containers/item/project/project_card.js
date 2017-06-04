//
// Copyright 2017 Minder Labs.
//

import gql from 'graphql-tag';
import React from 'react';

import { Fragments } from 'alien-api';

import { ReactUtil } from '../../../util/react';
import { Card } from '../../../components/card';

import { QueryItem } from '../item_container';

/**
 * Project card.
 */
export class ProjectCard extends React.Component {

  render() {
    return ReactUtil.render(this, () => {
      let { item:project } = this.props;
      if (!project) {
        return;
      }

      return (
        <Card item={ project }>
          Project
        </Card>
      );
    });
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
