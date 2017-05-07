//
// Copyright 2017 Alien Labs.
//

import { Queue } from '../util/queue';

//
// Start Redis then:
// babel-node ./src/testing/test_server.js
//

let q = new Queue('test', true);

q.process(job => {
  console.log(`Processing[${job.id}]: ` + JSON.stringify(job.data));
});
