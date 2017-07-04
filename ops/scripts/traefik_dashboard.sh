#!/bin/sh

#
# Access traefik-ui via port forwarding.
# https://medium.com/@alex__richards/getting-started-with-traefik-43fb7302b224
#

kubectl port-forward $(kubectl get pods | grep traefik-proxy | awk -F' ' '{print $1}') 8080:8080
