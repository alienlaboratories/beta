//
// Copyright 2017 Minder Labs.
//

import React from 'react';
import PropTypes from 'prop-types';
import gql from 'graphql-tag';

import { Fragments } from 'alien-api';

import { ReactUtil } from '../../../util/react';
import { Card, CardCanvas } from '../../../components/card';

import { QueryItem } from '../item_container';
import { TaskList } from '../task/task_list';

/**
 * Project card.
 */
export class ProjectCard extends React.Component {

  static propTypes = {
    mutator:    PropTypes.object.isRequired,
    viewer:     PropTypes.object.isRequired
  };

  render() {
    return ReactUtil.render(this, () => {
      let { mutator, viewer, item:project } = this.props;
      if (!project) {
        return;
      }

      let { tasks } = project;

      return (
        <Card mutator={ mutator } viewer={ viewer } item={ project }>

          <Card.Section id="tasks" title="Tasks">
            <TaskList mutator={ mutator } viewer={ viewer } parent={ project } project={ project } tasks={ tasks }/>
          </Card.Section>

        </Card>
      );
    });
  }
}

//
// HOC Container.
//

const ProjectItemQuery = gql`
  query ProjectItemQuery($key: KeyInput!) {
    item(key: $key) {
      ...ItemFragment
      ...ProjectBoardFragment
    }
  }

  ${Fragments.ItemFragment}  
  ${Fragments.ProjectBoardFragment}  
`;

export const ProjectCardContainer = QueryItem(ProjectItemQuery)(CardCanvas(ProjectCard));
