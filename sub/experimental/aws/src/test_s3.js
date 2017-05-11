//
// Copyright 2017 Minder Labs.
//

// https://aws.amazon.com/sdk-for-node-js
// http://docs.aws.amazon.com/amazondynamodb/latest/gettingstartedguide/GettingStarted.NodeJs.html

import AWS from 'aws-sdk';

let s3 = new AWS.S3();

// https://console.aws.amazon.com/s3/home?region=us-east-1
const testBucket = 'testing.aws';

let testKey = 'test-key';

s3.createBucket({ Bucket: testBucket }, (err, data) => {
  if (err) {
    console.log(err);
  } else {
    let params = { Bucket: testBucket, Key: testKey, Body: 'Hello!' };
    s3.putObject(params, function(err, data) {
      if (err) {
        console.log(err);
      } else {
        console.log(`Updated: ${testBucket}/${testKey}`);
      }
    });
  }
});
