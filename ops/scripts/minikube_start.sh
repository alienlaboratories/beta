#!/usr/bin/env bash

#
# Start using xhyve (replaces "minikube start").
# https://mtpereira.com/local-development-k8s.html
# ~/.minikube
#

PS4=''

# https://github.com/zchee/docker-machine-driver-xhyve#install
sudo chown root:wheel $(brew --prefix)/opt/docker-machine-driver-xhyve/bin/docker-machine-driver-xhyve
sudo chmod u+s $(brew --prefix)/opt/docker-machine-driver-xhyve/bin/docker-machine-driver-xhyve

minikube start

#
# Docker daemon
# https://kubernetes.io/docs/getting-started-guides/minikube/#reusing-the-docker-daemon
#
#

kubectl apply -f ./conf/k8s/local-docker-registry.yml

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
