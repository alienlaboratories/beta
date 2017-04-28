#!/usr/bin/env bash

#
# Config (http => https)
# https://medium.com/@patrickeasters/using-traefik-with-tls-on-kubernetes-cb67fb43a948
#

kubectl create configmap traefik-conf --from-file= ./conf/k8s/traefik.toml

#
# https://medium.com/@alex__richards/getting-started-with-traefik-43fb7302b224
# https://docs.traefik.io/user-guide/kubernetes
#

kubectl apply -f ./conf/k8s/traefik.yml

#
# Get address for DNS config.
# TODO(burdon): Wait for Pod to start.
#
echo
echo "[traefik-proxy]: LoadBalancer Ingress"
kubectl describe service traefik-proxy
