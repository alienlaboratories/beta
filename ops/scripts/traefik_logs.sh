#!/usr/bin/env bash

#
# Show logs on pod.
#

export RUN_LABEL=traefik-proxy

POD=$(kubectl get pods -o name | grep ${RUN_LABEL})

set -x

kubectl logs ${POD} -f
