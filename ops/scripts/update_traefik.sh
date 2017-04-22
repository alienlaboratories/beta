#!/usr/bin/env bash

#
# https://medium.com/@alex__richards/getting-started-with-traefik-43fb7302b224
#

kubectl apply -f ./config/k8s/traefik.yml

#
# Get address for DNS config.
# TODO(burdon): Wait for Pod.
#
echo
echo "[traefik-proxy]: LoadBalancer Ingress"
kubectl describe service traefik-proxy
