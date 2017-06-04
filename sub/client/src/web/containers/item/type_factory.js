//
// Copyright 2017 Alien Labs.
//

import { TypeRegistry } from '../../common/type_registry';

import { ItemCardContainer } from './item_container';

import { ContactCardContainer } from './contact/contact_card';
import { ProjectCardContainer } from './project/project_card';
import { TaskCardContainer } from './task/task_card';

/**
 * Class utility to create the TypeRegistry singleton.
 */
export const TypeRegistryFactory = () => new TypeRegistry({

  Item: {
    card: ItemCardContainer
  },

  Contact: {
    icon: 'contacts',
    card: ContactCardContainer
  },

  Document: {
    icon: 'insert_drive_file'
  },

  Group: {
    icon: 'group'
  },

  Project: {
    icon: 'assignment',
    card: ProjectCardContainer,
  //   toolbar: ProjectCanvasToolbar,
  //   canvas: {
  //     def: ProjectBoardCanvas,
  //   }
  },

  Task: {
    icon: 'assignment_turned_in',
    card: TaskCardContainer
  },

  User: {
    icon: 'accessibility'
  }

});
