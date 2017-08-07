#!/usr/bin/env bash

#===============================================================================
# Deploy Script.
#
# This script can be used to create or update a running service on the cluster,
# or to test a new image on the local minikube (by building the docker image
# directly inside minikube's local docker daemon.)
#===============================================================================

DIR="$(dirname "$0")"

PS4=''  # Don't print "+" in trace.

set -e  # Stop on error.

COL_RESET='\033[0m'
COL_BLACK='\033[0;30m'
COL_GREEN='\033[0;32m'
COL_BLUE='\033[1;94m'
COL_RED='\033[0;31m'

# Colors:
# http://stackoverflow.com/questions/5947742/how-to-change-the-output-color-of-echo-in-linux
function log { echo; echo -e "${COL_GREEN}###\n### $1\n###${COL_RESET}"; echo; }

#===============================================================================
# Globals.
# TODO(burdon): Standardize tools env. Prefix globals with ALIEN_
#===============================================================================

# Default cluster.
ALIEN_CLUSTER="beta.kube.alienlabs.io"

# TODO(burdon): Factor out account.
# https://console.aws.amazon.com/ecs/home?region=us-east-1#/repositories
AWS_ECS_DOCKER_REPO="956243632840.dkr.ecr.us-east-1.amazonaws.com"

# Minikube runs insecure Docker daemon.
# https://mtpereira.com/local-development-k8s.html
MINIKUBE_DOCKER_REPO="localhost:5000"

#===============================================================================
# Options.
#===============================================================================

# Docker image name.
DOCKER_IMAGE=${DOCKER_IMAGE:-"alien-app-server"}

# Kubernetes service label.
RUN_LABEL=${RUN_LABEL:-"alien-app-server"}

# Kubernetes Deployment and Service config.
SERVICE_CONF=${SERVICE_CONF:-"../../ops/conf/k8s/alien-app-server.yml"}

#===============================================================================
# Options.
#===============================================================================

BUILD=1
MINIKUBE=0
DELETE=0

for i in "$@"
do
case $i in
  -n|--nobuild)
  BUILD=0
  ;;

  -m|--mini|--minikube)
  MINIKUBE=1
  ;;

  -d|--delete)
  DELETE=1
  ;;
esac
done

#===============================================================================
# Build.
#===============================================================================

start=$SECONDS

mkdir -p ./dist

#
# Build Node assets.
#

if [ ${BUILD} -eq 1 ]; then

  set +x
  log "Building assets..."
  set -x

  # Create merged package file.
  ${DIR}/create_package.sh > dist/package.json

  # Test ./scripts/server.sh first.
  webpack
fi

#===============================================================================
# Docker: Build and push image.
#
# Error: no space left on device
# - eval $(minikube docker-env) docker info (see memory footprint)
#===============================================================================

set -x

#
# Copy resources for Dockerfile.
# TODO(burdon): Configure.
#

cp -R ../../conf dist
cp -R ../../data dist

#
# Build and push Docker image.
#

set +x
log "Configure Docker (${MINIKUBE_DOCKER_REPO})"
set -x

#
# NOTE: minikube must be running (./ops/scripts/minikube_start.sh)
#

minikube status
if [ $? -ne 0 ]; then
  echo "minikube must be running (for docker service)."
  echo "./ops/scripts/minikube_start.sh"
  exit 1
fi

if [ ${MINIKUBE} -eq 1 ]; then

  # Use minikube's docker daemon.
  eval $(minikube docker-env)

  # minikube repo.
  DOCKER_REPO=${MINIKUBE_DOCKER_REPO}
else

  # Use minikube's docker daemon (minikube must be running).
  eval $(minikube docker-env)

  # ECS: EC2 Container Service
  # Get token (valid for 12 hours).
  # https://console.aws.amazon.com/ecs/home?region=us-east-1#/repositories
  # http://docs.aws.amazon.com/cli/latest/reference/ecr/get-login.html
  # Errors if minikube's docker service isn't running.
  # Cannot connect to the Docker daemon... Is the docker daemon running?
  # NOTE: Docker no longer supports -e so suppress with --no-include-email
  # https://github.com/aws/aws-cli/issues/1926
  set +x
  eval $(aws ecr get-login --no-include-email)
  set -x

  DOCKER_REPO=${AWS_ECS_DOCKER_REPO}
fi

# If using minikube, docker build automatically puts the image into the minikube docker registry.
if [ ${BUILD} -eq 1 ]; then
  set +x
  log "Building Docker Image: ${DOCKER_IMAGE}"
  set -x

  DOCKERFILE='./Dockerfile'
  if [ ${MINIKUBE} -eq 1 ]; then
    MINIKUBE_DOCKERFILE='./dist/Dockerfile'
    MINIKUBE_APP_SERVER_URL='http://minikube.alienlabs.io:9000'

    cat ${DOCKERFILE} | sed -e "s~ENV APP_SERVER_URL\(.*\)~ENV APP_SERVER_URL=\"${MINIKUBE_APP_SERVER_URL}\"~g" > \
      ${MINIKUBE_DOCKERFILE}

    DOCKERFILE=${MINIKUBE_DOCKERFILE}
  fi

  # Remove existing.
# docker images --filter reference=${DOCKER_IMAGE} --format "{{.ID}}" | xargs docker rmi -f

  docker build -f ${DOCKERFILE} -t ${DOCKER_IMAGE} .
fi

if [ ${MINIKUBE} -eq 1 ]; then
  # https://kubernetes.io/docs/getting-started-guides/minikube/#reusing-the-docker-daemon
  # Just make sure you tag your Docker image with something other than ‘latest’
  # and use that tag while you pull the image
  TAG="testing"

  # TODO(burdon): Do we need to push?
  docker tag ${DOCKER_IMAGE}:latest ${MINIKUBE_DOCKER_REPO}/${DOCKER_IMAGE}:${TAG}
  docker push ${MINIKUBE_DOCKER_REPO}/${DOCKER_IMAGE}

  # List repos.
  # https://docs.docker.com/registry/spec/api/#listing-repositories
  # https://stackoverflow.com/questions/38979231/imagepullbackoff-local-repository-with-minikube
  curl -s -S $(minikube ip):5000/v2/_catalog

else
  TAG="latest"

  # Create via console.
  # https://console.aws.amazon.com/ecs/home
  DOCKER_IMAGE_URI=${DOCKER_REPO}/${DOCKER_IMAGE}

  set +x
  log "Pushing Image: ${DOCKER_IMAGE_URI}:${TAG}"
  set -x

  docker tag ${DOCKER_IMAGE}:latest ${DOCKER_IMAGE_URI}:${TAG}
  docker push ${DOCKER_IMAGE_URI}:${TAG}
fi

#===============================================================================
# Kubernetes: Create/restart service.
#
# NOTE: Deleting the pod automatically creates a new service.
# NOTE: To actually remnove the service and deployment:
# kubectl delete -f conf.yml
#===============================================================================

set +x
log "Setting context"
set -x

if [ ${MINIKUBE} -eq 1 ]; then
  kubectl config set-context minikube
else
  kubectl config use-context ${ALIEN_CLUSTER}
fi

kubectl config get-contexts

#
# Patch docker image for minikube repo.
#

if [ ${MINIKUBE} -eq 1 ]; then
  TMP_DIR=/tmp/k8s
  mkdir -p ${TMP_DIR}
  CONF=${SERVICE_CONF}
  SERVICE_CONF=${TMP_DIR}/$(basename ${SERVICE_CONF})
  cat ${CONF} | sed -e "s/\(image:\).*/\1 ${MINIKUBE_DOCKER_REPO}\/${DOCKER_IMAGE}:${TAG}/" > ${SERVICE_CONF}
  echo "Created ${SERVICE_CONF}"
fi

#
# Delete existing Service and Deployment definitions (kills pods).
#

if [ ${DELETE} -eq 1 ]; then
  SVC=$(kubectl get services -l run=${RUN_LABEL} -o name)
  if [ -n "${SVC}" ]; then
    set +x
    log "Deleting Service: ${SVC}"
    set -x

    kubectl delete -f ${SERVICE_CONF}
  fi
fi

#
# Create/upate config.
#

POD=$(kubectl get pods -l run=${RUN_LABEL} -o name)

set +x
log "Creating/Updating Service: ${RUN_LABEL}"
set -x

# Update config.
kubectl apply -f ${SERVICE_CONF}

#
# Restart existing pods (i.e., if updating).
#

if [ -n "${POD}" ]; then
  set +x
  log "Restarting pods..."
  set -x

  kubectl delete ${POD}
fi

#
# Validate.
#

set +x
duration=$(( SECONDS - start ))
log "OK: $(date) [${duration}s]"
set -x

kubectl describe services ${RUN_LABEL}

kubectl get pods

# TODO(burdon): Loop to curl status (check version).
if [ ${MINIKUBE} -eq 1 ]; then
  minikube service ${RUN_LABEL} --url
  curl -s $(minikube service ${RUN_LABEL} --url)/status | jq
fi

set +x
echo
echo "kubectl logs $(kubectl get pods -o name | grep ${DOCKER_IMAGE}) -f"
echo
set -x
