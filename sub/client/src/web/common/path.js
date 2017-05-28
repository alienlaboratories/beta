//
// Copyright 2017 Alien Labs.
//

import { goBack, goForward, push } from 'react-router-redux';

import { ID } from 'alien-core';

import { AppDefs } from '../../common/defs';

/**
 * Router paths.
 *
 * Paths:
 * /inbox
 * /favorites
 * /project/xxx
 * /project/team/xxx
 * /project/priority/xxx
 */
export class Path {

  // app/testing
  // app/inbox          Inbox
  // app/favorites      Favorites with Item xxx selected (e.g., if WebLayout).
  // app/card/xxx       Card canvas Item xxx
  // app/board/xxx      Board canvas

  static ROOT     = AppDefs.APP_PATH;
  static TESTING  = AppDefs.APP_PATH + '/testing';
  static ADMIN    = AppDefs.APP_PATH + '/admin';
  static HOME     = AppDefs.APP_PATH + '/inbox';

  /**
   * Generates path for router.
   * @param args Ordered array of args to be resolved.
   * @returns {string}
   */
  static route(args) {
    return Path.ROOT + '/' + _.map(args, arg => ':' + arg).join('/');
  }

  /**
   * Creates a URL for the given folder.
   * @param alias Name that corresponds to an alias property in a Folder item.
   * @return {string}
   */
  static folder(alias) {
    return `${Path.ROOT}/${alias}`;
  }

  /**
   * Creates a URL for the given canvas.
   * @param {Key} key
   * @param canvas
   * @return {string}
   */
  static canvas(key, canvas=undefined) {
    console.assert(key && key.id && key.type);
    let type = key.type.toLowerCase();
    if (canvas) {
      return `${Path.ROOT}/${type}/${canvas}/${ID.encodeKey(key)}`;
    } else {
      return `${Path.ROOT}/${type}/${ID.encodeKey(key)}`;
    }
  }
}

/**
 * Encapsulates navigation using the redux dispatcher.
 * Higher-level views can construct this and pass down so that children don't need to perform navigation directly.
 */
export class Navigator {

  /**
   * @param dispatch Redux dispatcher.
   */
  constructor(dispatch) {
    console.assert(dispatch);
    this.dispatch = dispatch;
  }

  // TODO(burdon): Prevent go back if at top.
  goBack() {
    this.dispatch(goBack());
  }

  goForward() {
    this.dispatch(goForward());
  }

  // TODO(burdon): Standardize usage.
  push(path) {
    this.dispatch(push(path));
  }

  pushCanvas(item) {
    this.push(Path.canvas(ID.key(item)));
  }
}

/**
 * Navigator by opening windows.
 */
export class WindowNavigator {

  constructor(serverProvider) {
    console.assert(serverProvider);
    this._serverProvider = serverProvider;
  }

  goBack() {}
  goForward() {}
  push() {}

  pushCanvas(item) {
    let path = this._serverProvider.value + Path.canvas(ID.key(item));
    window.open(path, 'ALIEN');
  }
}
