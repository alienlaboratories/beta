#!/usr/bin/env bash

#
# https://api.beta.kube.alienlabs.io/api/v1/proxy/namespaces/kube-system/services/kubernetes-dashboard
# kubectl proxy
#

kubectl create -f https://raw.githubusercontent.com/kubernetes/kops/master/addons/kubernetes-dashboard/v1.5.0.yaml
