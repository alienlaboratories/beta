#!/usr/bin/env bash

QUEUE="https://queue.amazonaws.com/956243632840/TaskQueue"

FILE="/tmp/aws_sqs_message.json"

#
# Payload
#

MESSAGE_BODY="Test"

#
# Filterable Metadata
#

MESSAGE_ATTRIBUTES=$(cat <<-END
{
  "Item": {
    "DataType": "String",
    "StringValue": "Test"
  }
}
END
)

echo ${MESSAGE_ATTRIBUTES} > ${FILE}

PS4=''
set -x

RESULT=$(aws sqs purge-queue \
  --queue-url=${QUEUE})

set +x
echo ${RESULT} | jq
set -x

RESULT=$(aws sqs send-message \
  --queue-url=${QUEUE} \
  --delay-seconds=1 \
  --message-body=${MESSAGE_BODY} \
  --message-attributes=file://${FILE})

set +x
echo ${RESULT} | jq
set -x

#
# Read messages.
# Reading doesn't delete the message; it increases the Receive Count.
# VisibilityTimeout hides the read message from other consumers until deleted.
# Use ReceiptHandle to delete.
#

RESULT=$(aws sqs receive-message \
  --queue-url=${QUEUE} \
  --attribute-names=All \
  --message-attribute-names=All \
  --wait-time-seconds=5 \
  --max-number-of-messages=1)

set +x
echo ${RESULT} | jq
set -x

#
# Remove message.
#

set +x
RECEIPT_HANDLE=$(echo ${RESULT} | jq -r '.Messages[].ReceiptHandle')
set -x

RESULT=$(aws sqs delete-message \
  --queue-url=${QUEUE} \
  --receipt-handle=${RECEIPT_HANDLE})

set +x
echo ${RESULT} | jq
set -x
