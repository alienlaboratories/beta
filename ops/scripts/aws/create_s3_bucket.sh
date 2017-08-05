#!/usr/bin/env bash

DIR=$(dirname "${BASH_SOURCE[0]}")

source ${DIR}/config.sh

#
# S3 Bucket for Kubernetes config.
# https://console.aws.amazon.com/s3/home?region=us-east-1
#

aws s3api create-bucket --bucket ${ALIEN_S3_BUCKET}
aws s3api put-bucket-versioning --bucket ${ALIEN_S3_BUCKET} --versioning-configuration Status=Enabled

aws s3 ls

export KOPS_STATE_STORE=s3://${ALIEN_S3_BUCKET}

