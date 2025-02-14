//
// Copyright 2017 Alien Labs.
//

import { createMemoryHistory } from 'react-router';

import { WebApp } from '../web/app/main';
import { Path } from '../web/common/path';
import { AppAction, AppReducer } from '../web/common/reducers';
import { ContextAction, ContextReducer } from '../web/common/context';

import { SidebarAction, SidebarReducer } from './sidebar/reducers';

/**
 * Test SidebarApp (enables testing within DOM).
 */
export class TestSidebarApp extends WebApp {

  constructor(config) {
    super(config);

    this._history = createMemoryHistory(Path.INBOX);
  }

  get history() {
    return this._history;
  }

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
