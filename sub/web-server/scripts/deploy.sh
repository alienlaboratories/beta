#!/usr/bin/env bash

# Node packages.
export PACKAGE_DIRS="util"

# Docker image name.
export DOCKER_IMAGE="alien-web-server"

# Kubernetes service label.
export RUN_LABEL="alien-web-server"

# Kubernetes Deployment and Service config.
export SERVICE_CONF="../../ops/conf/k8s/alien-web-server.yml"

# Run deploy.
../../tools/k8s/deploy.sh $@
