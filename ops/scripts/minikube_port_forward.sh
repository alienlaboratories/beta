#!/usr/bin/env bash

#
# For OAuth we register a Callback URI:
# http://minikube.alienlabs.io:9000/oauth/callback/google
# https://console.developers.google.com/apis/credentials?project=alienlabs-dev
#
# /etc/hosts redirects minikube.alienlabs.io to 127.0.0.1
# Then port forwarding redirects this to the minikube service URL.
#
# http://minikube.alienlabs.io:9000/user/login/google
#   => https://google.com?redirect=minikube.alienlabs.io:9000
#     => /etc/hosts
#       => ssh -L
#         => http://192.168.64.2:30058
#           => http://minikube.alienlabs.io:9000/user/callback/google
#

set -x

HOST="minikube.alienlabs.io"
PORT=9000

SERVICE="alien-app-server"

MINIKUBE_SERVICE_IP=$(minikube service ${SERVICE} --url | sed 's~http[s]*://~~g')

IP=$(grep ${HOST} /etc/hosts | awk -F' ' ' {print $1}')

ssh -L ${IP}:${PORT}:${MINIKUBE_SERVICE_IP} -N 127.0.0.1
