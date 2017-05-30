//
// Copyright 2017 Alien Labs.
//

import { HttpUtil, KeyListener } from 'alien-util';
import { Const } from 'alien-core';

import { KeyCodes } from './common';

import { AppDefs } from '../common/defs';

import { SidebarApp } from './sidebar/main';
import { SidebarAction } from './sidebar/reducers';

import Application from './sidebar/root';

//
// Config passed via args from content script container.
//

const config = _.merge({
  root: AppDefs.DOM_ROOT,

  // TODO(burdon): Build option (based on CRX ID?)
  env: 'development',

  app: {
    platform: Const.PLATFORM.CRX,
    name: AppDefs.APP_NAME
  }
}, HttpUtil.parseUrlParams());

//
// App.
//

const app = new SidebarApp(config);

app.init().then(() => {
  app.render(Application);

  new KeyListener()
    .listen(KeyCodes.TOGGLE, () => app.store.dispatch(SidebarAction.toggleVisibility()));
});
