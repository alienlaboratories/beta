#!/usr/bin/env bash

# Node packages.
export PACKAGE_DIRS="util"

# Docker image name.
export DOCKER_IMAGE="alien-web-server"

# Kubernetes service label.
export RUN_LABEL="alien-web-server"

# Kubernetes Deployment and Service config.
export SERVICE_CONF="../../ops/conf/k8s/alien-web-server.yml"

# TODO(burdon): Custom build (generalize to npm run build).
# Generate markdown.
babel-node src/tools/markdown.js

# Run deploy.
../../ops/scripts/deploy.sh $@
