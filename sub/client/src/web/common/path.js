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
   * @param itemId  Global ID.
   * @param canvas
   * @return {string}
   */
  static canvas(itemId, canvas=undefined) {
    let { type } = ID.fromGlobalId(itemId);
    if (canvas) {
      return `${Path.ROOT}/${type.toLowerCase()}/${canvas}/${itemId}`;
    } else {
      return `${Path.ROOT}/${type.toLowerCase()}/${itemId}`;
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

  push(path) {
    this.dispatch(push(path));
  }

  // TODO(burdon): Standardize usage.
  pushCanvas(item) {
    this.push(Path.canvas(ID.toGlobalId(item.type, item.id)));
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
    let path = this._serverProvider.value + Path.canvas(ID.toGlobalId(item.type, item.id));

    console.log('::::', path);

//    window.open(path, 'ALIEN');
  }
}
