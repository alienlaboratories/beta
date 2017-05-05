//
// Copyright 2017 Alien Labs.
//

import { WebApp } from '../web/app/main';
import { AppAction, AppReducer, ContextAction, ContextReducer } from '../web/common/reducers';

import { SidebarAction, SidebarReducer } from './sidebar/reducers';

/**
 * Test SidebarApp (enables testing within DOM).
 */
export class TestSidebarApp extends WebApp {

  get reducers() {
    return {
      // Main app.
      // TODO(burdon): Push to BaseApp.
      [AppAction.namespace]: AppReducer(this.injector, this.config, this.client),

      // Context.
      [ContextAction.namespace]: ContextReducer,

      // Sidebar-specific.
      [SidebarAction.namespace]: SidebarReducer
    };
  }
}
