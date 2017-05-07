//
// Copyright 2017 Alien Labs.
//

import { Queue } from '../util/queue';

//
// Start Redis then:
// babel-node ./src/testing/test_client.js
//

let q = new Queue('test');

q.add({ value: Date.now() }).then(job => {
  console.log('Submitted: ' + job.id);
  q.close();
});
