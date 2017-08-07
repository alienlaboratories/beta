#!/usr/bin/env bash

# TODO(burdon): Standarize ENV names (ALIEN_)

#
# AWS
#

export ALIEN_AWS_ACCOUNT_ID="956243632840"

export ALIEN_AWS_REGION="us-east-1"

# https://console.aws.amazon.com/ecs/home?region=us-east-1#/repositories
export AWS_ECS_DOCKER_REPO="${ALIEN_AWS_ACCOUNT_ID}.dkr.ecr.${ALIEN_AWS_REGION}.amazonaws.com"

# Minikube runs insecure Docker daemon.
# https://mtpereira.com/local-development-k8s.html
export MINIKUBE_DOCKER_REPO="localhost:5000"

#
# Kops
# https://github.com/kubernetes/kops
#

export ALIEN_K8S_HOSTED_ZONE="kube.alienlabs.io"

export CLUSTER_NAME="beta"

export CLUSTER="${CLUSTER_NAME}.${ALIEN_K8S_HOSTED_ZONE}"

export ALIEN_S3_BUCKET="cluster.${CLUSTER}"

# https://github.com/kubernetes/kops/tree/master/docker
export KOPS_STATE_STORE="s3://${ALIEN_S3_BUCKET}"
