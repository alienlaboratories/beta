#!/usr/bin/env bash

export ALIEN_AWS_ACCOUNT_ID="956243632840"

export ALIEN_CLUSTERS="kube.alienlabs.io"

export CLUSTER_NAME="beta"

export CLUSTER="${CLUSTER_NAME}.${ALIEN_CLUSTERS}"

export ALIEN_S3_BUCKET="cluster.${CLUSTER}"

export KOPS_STATE_STORE="s3://${ALIEN_S3_BUCKET}"
