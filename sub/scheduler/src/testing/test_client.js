//
// Copyright 2017 Alien Labs.
//

import { Queue } from '../util/bull_queue';

//
// Start Redis then:
// babel-node ./src/testing/test_client.js
//

let queue = new Queue('test');

queue.add({ value: Date.now() }).then(job => {
  queue.close();
});
