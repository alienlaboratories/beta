#!/usr/bin/env bash

NAME=TaskQueue

CONF=$PWD/conf/aws/queue.json

#
# Re-entrant create.
#
# https://aws.amazon.com/sqs
# https://docs.aws.amazon.com/cli/latest/reference/sqs/create-queue.html
#
# https://console.aws.amazon.com/sqs/home
#
# arn:aws:sqs:us-east-1:956243632840:TaskQueue
# https://sqs.us-east-1.amazonaws.com/956243632840/TaskQueue
#

aws sqs create-queue --queue-name ${NAME} --attributes file://${CONF}
