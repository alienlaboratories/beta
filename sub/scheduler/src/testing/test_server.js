//
// Copyright 2017 Alien Labs.
//

import { Queue } from '../util/bull_queue';

//
// Start Redis then:
// babel-node ./src/testing/test_server.js
//

let q = new Queue('test', true);

q.process(data => {
  if (!data.value) {
    throw new Error('Bad value');
  }

  return { duration: Date.now() - data.value };
});
