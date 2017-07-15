#!/usr/bin/env bash

NAME=TaskQueue

CONF=$PWD/conf/aws/queue.json

#
# Re-entract create.
#
# https://aws.amazon.com/sqs
# https://docs.aws.amazon.com/cli/latest/reference/sqs/create-queue.html
#
# https://console.aws.amazon.com/sqs/home
# https://queue.amazonaws.com/861694698401/TaskQueue
#

aws sqs create-queue --queue-name ${NAME} --attributes file://${CONF}
