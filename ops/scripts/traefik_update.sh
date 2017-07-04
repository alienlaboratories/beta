#!/usr/bin/env bash

#
# Traefik Config (http => https redirect)
# https://medium.com/@patrickeasters/using-traefik-with-tls-on-kubernetes-cb67fb43a948
# This is mounted as a volume by the service.
#

kubectl create configmap traefik-conf --from-file=./conf/k8s/traefik.toml

#
# https://medium.com/@alex__richards/getting-started-with-traefik-43fb7302b224
# https://docs.traefik.io/user-guide/kubernetes
#
# NOTE: Must update DNS records if delete/create new ELB
# TODO(burdon): Set up hosted zone?
#

kubectl apply -f ./conf/k8s/traefik.yml

#
# Get address for DNS config.
# TODO(burdon): Wait for Pod to start.
#

echo "Waiting to start..."
sleep 10

echo "Configure DNS CNAME URL for ELB (e.g., www.alienlabs.io)"
kubectl describe service traefik-proxy | sed -n 's/^LoadBalancer Ingress:.\(.*\)/\1/p'
