#!/usr/bin/env bash

#
# Start using xhyve (replaces "minikube start").
# https://mtpereira.com/local-development-k8s.html
#

PS4=''

start=$SECONDS
set -x

# Used by deploy to build/push images.
MINIKUBE_DOCKER_REPO=${MINIKUBE_DOCKER_REPO:-"localhost:5000"}

# NOTE: memory size is only set on creation (run minkube delete to restart).
# https://github.com/kubernetes/minikube/issues/567
minikube start --vm-driver=xhyve --memory=2048 --insecure-registry=${MINIKUBE_DOCKER_REPO}

eval $(minikube docker-env)
docker info

minikube status
minikube dashboard --url

set +x
echo "OK [$(( SECONDS - start ))s]"
