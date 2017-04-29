#!/usr/bin/env bash

# Node packages.
export PACKAGE_DIRS="api core services util"

# Docker image name.
export DOCKER_IMAGE="alien-app-server"

# Kubernetes service label.
export RUN_LABEL="alien-app-server"

# Kubernetes Deployment and Service config.
export SERVICE_CONF="../../ops/conf/k8s/alien-app-server.yml"

# Run deploy.
../../tools/k8s/deploy.sh $@
