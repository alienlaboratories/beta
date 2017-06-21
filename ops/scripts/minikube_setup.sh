#!/usr/bin/env bash

#
# Set-up kube-registry-proxy
# https://mtpereira.com/local-development-k8s.html
#
# Check: http://192.168.64.2:30000/#!/service?namespace=kube-system (kube-registry)
#
# To push an image to the minikube repo:
# eval $(minikube docker-env)
# docker build -t ${IMAGE} .
# docker tag ${IMAGE}:latest ${IMAGE}:test
#

kubectl apply -f ./conf/k8s/local-docker-registry.yml
