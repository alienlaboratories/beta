#!/usr/bin/env bash

#
# Minikue set-up
#

PS4=''

start=$SECONDS
set -x

#
# Options.
#

DELETE=0

for i in "$@"
do
case $i in
  -d|--delete)
  DELETE=1
  ;;
esac
done

# Delete the cluster.
# TODO(burdon): This fails (manually delete ~/.minikube/machines
# https://github.com/kubernetes/minikube/issues/1021 [06/01/17]
if [ ${DELETE} -eq 1 ]; then
  sudo rm -rf ~/.minikube
# minikube delete
fi

# https://github.com/zchee/docker-machine-driver-xhyve#install
sudo chown root:wheel $(brew --prefix)/opt/docker-machine-driver-xhyve/bin/docker-machine-driver-xhyve
sudo chmod u+s $(brew --prefix)/opt/docker-machine-driver-xhyve/bin/docker-machine-driver-xhyve

# Used by deploy to build/push images; port number matches local-docker-registry.yml
# https://mtpereira.com/local-development-k8s.html
MINIKUBE_DOCKER_REPO=${MINIKUBE_DOCKER_REPO:-"localhost:5000"}

# Use docker with xhyve (not VirtualBox).
# NOTE: memory size is only set on creation (run minikube delete to restart).
# https://github.com/kubernetes/minikube/issues/567
# https://mtpereira.com/local-development-k8s.html
minikube start --vm-driver=xhyve --memory=4096 --insecure-registry=${MINIKUBE_DOCKER_REPO}

# Add-ons.
# https://github.com/kubernetes/kubernetes/tree/master/cluster/addons
minikube addons enable ingress
minikube addons enable registry

# TODO(burdon): Configure AWS ECR (from ~/.aws/credentials). Use excpect script?
minikube addons enable registry-creds
minikube addons configure registry-creds

minikube status
minikube dashboard --url

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

kubectl config use-context minikube

# https://mtpereira.com/local-development-k8s.html
# https://github.com/kubernetes/kubernetes/tree/master/cluster/addons/registry
kubectl apply -f ./conf/k8s/local-docker-registry.yml

# Check: Insecure Registries (should match above).
eval $(minikube docker-env)
docker system info

set +x
echo "OK [$(( SECONDS - start ))s]"
