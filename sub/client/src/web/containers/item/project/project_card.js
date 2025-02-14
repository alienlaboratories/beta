//
// Copyright 2017 Alien Labs.
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
      let { mutator, viewer, item:project, readOnly, sections } = this.props;
      if (!project) {
        return;
      }

      let { tasks } = project;

      // TODO(burdon): Pass all args.
      return (
        <Card mutator={ mutator } viewer={ viewer } item={ project } readOnly={ readOnly } sections={ sections }>

          { sections &&
          <Card.Section id="tasks" title="Tasks">
            <TaskList mutator={ mutator }
                      viewer={ viewer }
                      parent={ project }
                      project={ project }
                      tasks={ tasks }
                      readOnly={ readOnly }/>
          </Card.Section>
          }

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
      ...ProjectFragment
      ...ProjectBoardFragment
    }
  }

  ${Fragments.ItemFragment}  
  ${Fragments.ProjectFragment}  
  ${Fragments.ProjectBoardFragment}  
`;

export const ProjectCardContainer = QueryItem(ProjectItemQuery)(CardCanvas(ProjectCard));
