#!/usr/bin/env bash

set -x

# TODO(burdon): Options.

webpack --config webpack-srv.config.js

#
# Strip non-prod deps.
#

cat package.json \
  | jq 'del(.scripts)' \
  | jq 'del(.devDependencies)' \
  | jq 'del(.dependencies."alien-core")' \
  > dist/package.json


#
# Build and push Docker image.
# https://console.aws.amazon.com/ecs/home?region=us-east-1#/repositories
#

export IMAGE_NAME=alien-web-server

export RUN_LABEL=alien-web-server

export ECR_REPO=861694698401.dkr.ecr.us-east-1.amazonaws.com/alien-web-server

eval "$(docker-machine env ${DOCKER_MACHINE})"

#docker login

eval $(aws ecr get-login)

docker build -t ${IMAGE_NAME} .
docker tag ${IMAGE_NAME}:latest ${ECR_REPO}:latest
docker push ${ECR_REPO}:latest

#
# Restart service.
#

POD=$(kubectl get pods -l run=${RUN_LABEL} -o name)
if [ -z "${POD}" ]; then
  # Create.
  kubectl create -f ../../ops/config/k8s/alien-web-server.yml
else
  # Restart.
  kubectl delete ${POD}
fi

#
# Info.
#

kubectl describe services ${RUN_LABEL}
