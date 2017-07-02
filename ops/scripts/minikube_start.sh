#!/usr/bin/env bash

#
# Start using xhyve (replaces "minikube start").
# https://mtpereira.com/local-development-k8s.html
#

PS4=''

start=$SECONDS
set -x

MINIKUBE_DOCKER_REPO=${MINIKUBE_DOCKER_REPO:-"localhost:5000"}

# minikube ssh
# TODO(burdon): Admin (e.g., set disk size/clean-up).
minikube start --vm-driver xhyve --insecure-registry ${MINIKUBE_DOCKER_REPO}

minikube status

set +x
echo "OK [$(( SECONDS - start ))s]"
