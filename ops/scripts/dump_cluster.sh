#!/usr/bin/env bash

# TODO(burdon): Factor out exports.

export ALIEN_CLUSTERS=kube.alienlabs.io

export CLUSTER_NAME=beta

export CLUSTER=${CLUSTER_NAME}.${ALIEN_CLUSTERS}

export ALIEN_S3_BUCKET=cluster.${CLUSTER}

export KOPS_STATE_STORE=s3://${ALIEN_S3_BUCKET}

kops toolbox dump --name=${CLUSTER} --state=${KOPS_STATE_STORE}
