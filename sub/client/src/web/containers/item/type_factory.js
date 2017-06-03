//
// Copyright 2017 Alien Labs.
//

import { TypeRegistry } from '../../common/type_registry';

// import { ContactCard, ContactCanvas } from './type/contact';
// import { DocumentColumn } from './type/document';
// import { GroupCanvas } from './type/group';
// import { ProjectCard, ProjectBoardCanvas, ProjectCanvasToolbar } from './type/project';
// import { TaskCard, TaskCanvas } from './type/task';
// import { UserCanvas } from './type/user';

/**
 * Class utility to create the TypeRegistry singleton.
 */
export const TypeRegistryFactory = () => new TypeRegistry({

  Contact: {
    icon: 'contacts',
  //   card: ContactCard,
  //   canvas: {
  //     def: ContactCanvas
  //   }
  },

  Document: {
    icon: 'insert_drive_file',
  //   column: DocumentColumn
  },

  Group: {
    icon: 'group',
  //   canvas: {
  //     def: GroupCanvas
  //   }
  },

  Project: {
    icon: 'assignment',
  //   card: ProjectCard,
  //   toolbar: ProjectCanvasToolbar,
  //   canvas: {
  //     def: ProjectBoardCanvas,
  //   }
  },

  Task: {
    icon: 'assignment_turned_in',
  //   card: TaskCard,
  //   canvas: {
  //     def: TaskCanvas
  //   }
  },

  User: {
    icon: 'accessibility',
  //   canvas: {
  //     def: UserCanvas
  //   }
  }

});
