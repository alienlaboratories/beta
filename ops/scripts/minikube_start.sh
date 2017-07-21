#!/usr/bin/env bash

#
# Start using xhyve (replaces "minikube start").
# https://mtpereira.com/local-development-k8s.html
# ~/.minikube
#

PS4=''

minikube start

eval $(minikube docker-env)
docker info

#
# Sync clock.
# Firebase API fails if clock is out of sync.
# https://github.com/kubernetes/minikube/issues/1378
#

exec $(dirname "$0")/minikube_clock_sync.sh

#
# Check running.
#

minikube status
minikube dashboard --url
