//
// Copyright 2017 Alien Labs.
//

import { WebServer } from './server';

global.server = new WebServer().init().then(server => server.start());
