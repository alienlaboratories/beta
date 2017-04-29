#!/usr/bin/env bash

#
# Firebase API fails if clock is out of sync.
# https://github.com/kubernetes/minikube/issues/1378
#

minikube ssh -- docker run -i --rm --privileged --pid=host debian nsenter -t 1 -m -u -n -i date -u $(date -u +%m%d%H%M%Y)
