#!/usr/bin/env bash

#
# http://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html
# TODO(burdon): Testing: https://www.npmjs.com/package/dynamodb-local
#

cd ${PROJECTS_HOME}/tools/dynamodb_local_latest

java -Djava.library.path=./DynamoDBLocal_lib -jar DynamoDBLocal.jar -sharedDb -inMemory
