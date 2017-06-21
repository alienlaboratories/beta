//
// Copyright 2017 Alien Labs.
//

import { TypeRegistry } from '../../common/type_registry';

import { ContactCard, ContactCardContainer } from './contact';
import { DocumentColumn } from './document';
import { ProjectCard, ProjectBoardContainer, ProjectBoardHeaderContainer } from './project';
import { TaskCard, TaskCardContainer } from './task';

/**
 * Class utility to create the TypeRegistry singleton.
 */
export const TypeRegistryFactory = () => new TypeRegistry({

  Contact: {
    icon: 'contacts',
    card: ContactCard,
    container: ContactCardContainer
  },

  Document: {
    icon: 'insert_drive_file',
    column: DocumentColumn
  },

  // TODO(burdon): Use classnames.
  Group: {
    icon: 'group'
  },

  Project: {
    icon: 'assignment',
    card: ProjectCard,
    container: ProjectBoardContainer,
    header: ProjectBoardHeaderContainer
  },

  Task: {
    icon: 'assignment_turned_in',
    card: TaskCard,
    container: TaskCardContainer
  },

  User: {
    icon: 'accessibility'
  }

});
