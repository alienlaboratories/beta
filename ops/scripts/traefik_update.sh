#!/usr/bin/env bash

#
# Traefik Config (http => https redirect)
# https://medium.com/@patrickeasters/using-traefik-with-tls-on-kubernetes-cb67fb43a948
# This is mounted as a volume by the service.
#

# Update ingress config.
kubectl apply -f ./conf/k8s/alien-ingress.yml

# TODO(burdon): Error if already exists.
kubectl delete configmap traefik-conf
kubectl create configmap traefik-conf --from-file=./conf/k8s/traefik.toml

#
# https://medium.com/@alex__richards/getting-started-with-traefik-43fb7302b224
# https://docs.traefik.io/user-guide/kubernetes
#

kubectl apply -f ./conf/k8s/traefik.yml

# NOTE: Must update DNS records if delete/create new ELB
# TODO(burdon): Set up hosted zone?
# TODO(burdon): Delete pod to restart it? (apply vs create/delete?)
echo "Restarting pod..."
POD=$(kubectl get pods -o name | grep traefik-proxy)
kubectl delete ${POD}

#
# Get address for DNS config.
#

# TODO(burdon): Polling script.
echo "Waiting to start..."
sleep 20

echo "ELB Endpoint (Config DNS CNAME)"
kubectl describe service traefik-proxy | sed -n 's/^LoadBalancer Ingress:.\(.*\)/\1/p'

kubectl get pods
