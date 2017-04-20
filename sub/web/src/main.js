//
// Copyright 2017 Minder Labs.
//

import { WebServer } from './server';

global.server = new WebServer().init().then(server => server.start());
