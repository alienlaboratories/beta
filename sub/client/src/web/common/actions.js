//
// Copyright 2017 Minder Labs.
//

import { AppAction } from './reducers';

/**
 * Toolbar actions.
 */
export class Actions {

  // TODO(burdon): Enable base_app to configure different sets of actions.

  constructor(dispatch, queryRegistry) {
    console.assert(dispatch && queryRegistry);

    this._debug = Actions.Debug(dispatch);
    this._runtime = Actions.Runtime(dispatch, queryRegistry);
  }

  get debug() {
    return this._debug;
  }

  get runtime() {
    return this._runtime;
  }

  /**
   * LHS Debug actions.
   */
  static Debug = (dispatch) => [
    {
      type: 'bug',
      title: 'Debug info.',
      icon: 'bug_report',
      handler: (action) => {
        dispatch(AppAction.toggleDebugPanel());
      }
    },

    // TODO(burdon): Use navigator (need FQ URL for CRX).
    {
      type: 'link',
      title: 'GraphiQL.',
      icon: 'language',
      href: '/testing/graphiql',
      handler: (action) => { window.open(action.href); }
    },
    {
      type: 'link',
      title: 'Admin console.',
      icon: 'graphic_eq',
      href: '/admin',
      handler: (action) => { window.open(action.href); }
    },
    {
      type: 'link',
      title: 'Account settings.',
      icon: 'settings',
      href: '/profile',
      handler: (action) => { window.open(action.href); }
    }
  ];

  /**
   * RHS App runtime actions.
   */
  static Runtime = (dispatch, queryRegistry) => [
    {
      type: 'refresh',
      title: 'Refresh queries.',
      icon: 'refresh',
      handler: (action) => {
        queryRegistry.invalidate();
      }
    }
  ];
}
