//
// Copyright 2017 Minder Labs.
//

Logger.setLevel({}, Logger.Level.debug);

import { AppDefs } from '../common/defs';
import { HttpUtil, KeyListener } from 'alien-core';

import { BackgroundCommand, KeyCodes } from './common';

import { SidebarAction } from './sidebar/reducers';
import { Application, SidebarApp } from './sidebar/app';

//
// Config passed via args from content script container.
//

const config = _.merge({
  root: AppDefs.DOM_ROOT,

  // TODO(burdon): Build option (based on CRX ID?)
  env: 'development',

  app: {
    platform: AppDefs.PLATFORM.CRX,
    name: AppDefs.APP_NAME
  }
}, HttpUtil.parseUrlParams());

const app = new SidebarApp(config);

app.init().then(() => {
  app.render(Application);

  // TODO(burdon): Dynamically set on scroll container (on mouseover?)
  // https://www.npmjs.com/package/prevent-parent-scroll
  /*
  let preventParentScroll = new PreventParentScoll(root);
  preventParentScroll.start();
  */

  new KeyListener()
    .listen(KeyCodes.TOGGLE, () => app.store.dispatch(SidebarAction.toggleVisibility()));
});
