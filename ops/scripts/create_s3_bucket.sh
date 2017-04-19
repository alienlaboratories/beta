#!/usr/bin/env bash

# TODO(burdon): Options.

export CLUSTER_NAME=beta

export ROBOTIK_CLUSTERS=kube.robotik.io

export CLUSTER=${CLUSTER_NAME}.${ROBOTIK_CLUSTERS}

#
# S3 Buckets.
# https://console.aws.amazon.com/s3/home?region=us-east-1
#

export ROBOTIK_S3_BUCKET=cluster.${CLUSTER}

aws s3api create-bucket --bucket ${ROBOTIK_S3_BUCKET}
aws s3api put-bucket-versioning --bucket ${ROBOTIK_S3_BUCKET} --versioning-configuration Status=Enabled

export KOPS_STATE_STORE=s3://${ROBOTIK_S3_BUCKET}
