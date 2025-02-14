#!/usr/bin/env bash

#
# 1). Build webpack modules.
#
# 2). Build Dockerfile (install node modules, etc.) [NOTE: lots of red "npm info lifecycle" messages].
#
# 3). Push image to ECR (via minikube's docker service).
#     https://console.aws.amazon.com/ecs/home?region=us-east-1#/repositories/alien-worker
#
# 4). Trigger updates to Kubernetes (AWS).
#     http://localhost:8001/ui (run kubectl proxy)
#     http://localhost:8001/api/v1/namespaces/kube-system/services/kubernetes-dashboard/proxy/#!/service/default/alien-worker
#     - Navigate to pod and check container's image (e.g., alien-worker:prod) [force delete?]
#     - Crash backoff on container start-up failure: Check logs.
#

# Node packages (merge sub package.json modules).
export PACKAGE_DIRS="api core services util"

# Docker image name.
export DOCKER_IMAGE="alien-worker"

# Kubernetes service label.
export RUN_LABEL="alien-worker"

# Kubernetes Deployment and Service config.
export SERVICE_CONF="../../ops/conf/k8s/alien-worker.yml"

# Run deploy.
../../ops/scripts/deploy.sh $@
