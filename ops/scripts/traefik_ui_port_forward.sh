#!/usr/bin/env bash

#
# Access traefik-ui via port forwarding.
# https://medium.com/@alex__richards/getting-started-with-traefik-43fb7302b224
#

POD=$(kubectl get pods | grep traefik-proxy | awk -F' ' ' {print $1}')

echo
echo "[traefik-proxy]: Pod ${POD} => http://localhost:8080"

kubectl port-forward ${POD} 8080:8080
