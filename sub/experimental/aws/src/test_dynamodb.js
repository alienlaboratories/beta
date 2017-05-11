//
// Copyright 2017 Minder Labs.
//

// TODO(burdon): Upload clinton emails.

// https://aws.amazon.com/sdk-for-node-js
// http://docs.aws.amazon.com/amazondynamodb/latest/gettingstartedguide/GettingStarted.NodeJs.01.html

import _ from 'lodash';
import * as fs from 'fs';
import path from 'path';
import AWS from 'aws-sdk';

/**
 * Config for local server.
 */
AWS.config.update({
  region: 'us-east-1',
  endpoint: 'http://localhost:8000'
});

let dynamodb = new AWS.DynamoDB();

let params = {
  TableName : 'Movies',
  KeySchema: [       
    { AttributeName: 'year',  KeyType: 'HASH'},   // Partition key.
    { AttributeName: 'title', KeyType: 'RANGE' }  // Sort key.
  ],
  AttributeDefinitions: [       
    { AttributeName: 'year',  AttributeType: 'N' },
    { AttributeName: 'title', AttributeType: 'S' }
  ],
  ProvisionedThroughput: {       
    ReadCapacityUnits: 10, 
    WriteCapacityUnits: 10
  }
};

if (false) {
  dynamodb.createTable(params, (err, data) => {
    if (err) {
      // ECONNREFUSED: server not running.
      // ResourceInUseException: can't recreate table.
      console.error(err);
    } else {
      console.log('Created Table:', JSON.stringify(data, null, 2));
    }
  });
}

let client = new AWS.DynamoDB.DocumentClient();

if (false) {
  let data = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/moviedata.json'), 'utf8'));
  _.each(data, item => {
    let params = {
      TableName: 'Movies',
      Item: _.pick(item, 'year', 'title', 'info')
    };

    client.put(params, (err, data) => {
      if (err) {
        console.error(err);
      }
    });
  });
}

if (true) {
  let params = {
    TableName: 'Movies',
    KeyConditionExpression: '#yr = :yyyy',
    ExpressionAttributeNames: {
      '#yr': 'year'
    },
    ExpressionAttributeValues: {
      ':yyyy': 1985
    }
  };

  client.query(params, (err, data) => {
    if (err) {
      console.error(err);
    } else {
      console.log('Items:', JSON.stringify(_.map(data.Items, item => _.pick(item, 'year', 'title')), null, 2));
    }
  });
}

if (false) {
  let params = {
    TableName: 'Movies'
  };

  dynamodb.deleteTable(params, (err, data) => {
    if (err) {
      console.error(err);
    } else {
      console.log('Deleted:', JSON.stringify(data, null, 2));
    }
  });
}
