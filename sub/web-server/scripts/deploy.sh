#!/usr/bin/env bash

set -e  # Stop on error.
set -x  # Echo.

# TODO(burdon): Options.
# TODO(burdon): Factor out with other containers.

webpack --config webpack-srv.config.js

#
# Strip non-prod deps.
#

cat package.json \
  | jq 'del(.scripts)' \
  | jq 'del(.devDependencies)' \
  | jq 'del(.dependencies."alien-util")' \
  > dist/package.json

#
# Build and push Docker image.
# https://console.aws.amazon.com/ecs/home?region=us-east-1#/repositories
#

export IMAGE_NAME=alien-web-server

export RUN_LABEL=alien-web-server

# Create via console.
# https://console.aws.amazon.com/ecs/home
export ECR_REPO=861694698401.dkr.ecr.us-east-1.amazonaws.com/${IMAGE_NAME}

eval $(docker-machine env ${DOCKER_MACHINE})

eval $(aws ecr get-login)

docker build -t ${IMAGE_NAME} .
docker tag ${IMAGE_NAME}:latest ${ECR_REPO}:latest
docker push ${ECR_REPO}:latest

#
# Restart service.
# NOTE: Delete and re-create when changing service definitions (kubectl delete -f).
#

POD=$(kubectl get pods -l run=${RUN_LABEL} -o name)
if [ -z "${POD}" ]; then
  # Create.
  kubectl create -f ../../ops/conf/k8s/alien-web-server.yml
else
  # Restart.
  kubectl delete ${POD}
fi

#
# Info.
#

kubectl describe services ${RUN_LABEL}
