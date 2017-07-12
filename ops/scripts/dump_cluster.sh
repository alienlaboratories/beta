#!/usr/bin/env bash

# TODO(burdon): Factor out exports.

export ROBOTIK_CLUSTERS=kube.robotik.io

export CLUSTER_NAME=beta

export CLUSTER=${CLUSTER_NAME}.${ROBOTIK_CLUSTERS}

export ROBOTIK_S3_BUCKET=cluster.${CLUSTER}

export KOPS_STATE_STORE=s3://${ROBOTIK_S3_BUCKET}

kops toolbox dump --name=${CLUSTER} --state=${KOPS_STATE_STORE}
