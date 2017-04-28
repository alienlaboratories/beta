#!/usr/bin/env bash

#
# Show logs on pod.
# NOTE: Even on minikube it sometimes takes a minute for the container to start (Waiting: ContainerCreating).
#

export RUN_LABEL=alien-app-server

POD=$(kubectl get pods -o name | grep ${RUN_LABEL})

set -x

kubectl logs ${POD} -f
