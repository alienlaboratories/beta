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

function log { echo; echo "###"; echo "### $1"; echo "###"; echo; }

#===============================================================================
# Globals.
# TODO(burdon): Standardize tools env. Prefix globals with ALIEN_
#===============================================================================

# Default cluster.
ALIEN_CLUSTER="beta.kube.robotik.io"

# https://console.aws.amazon.com/ecs/home?region=us-east-1#/repositories
AWS_ECS_DOCKER_REPO="861694698401.dkr.ecr.us-east-1.amazonaws.com"

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
#===============================================================================

set -x

#
# Copy resources for Dockerfile.
#

cp -R ../../conf dist
cp -R ../../data dist

#
# Build and push Docker image.
#

set +x
log "Configure Docker"
set -x

if [ ${MINIKUBE} -eq 1 ]; then

  # Use minikube's docker daemon.
  eval $(minikube docker-env)

  # minikube repo.
  DOCKER_REPO=${MINIKUBE_DOCKER_REPO}
else

  # Use minikube's docker daemon.
  eval $(minikube docker-env)
# eval $(docker-machine env ${DOCKER_MACHINE})

  # Get token (valid for 12 hours).
  # http://docs.aws.amazon.com/cli/latest/reference/ecr/get-login.html
  # Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?
  set +x
  eval $(aws ecr get-login)
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
    MINIKUBE_APP_SERVER_URL='http://minikube.robotik.io:9000'

    cat ${DOCKERFILE} | sed -e "s~ENV APP_SERVER_URL\(.*\)~ENV APP_SERVER_URL=\"${MINIKUBE_APP_SERVER_URL}\"~g" > \
      ${MINIKUBE_DOCKERFILE}

    DOCKERFILE=${MINIKUBE_DOCKERFILE}
  fi

  docker build -f ${DOCKERFILE} -t ${DOCKER_IMAGE} .
fi

if [ ${MINIKUBE} -eq 1 ]; then
  # https://kubernetes.io/docs/getting-started-guides/minikube/#reusing-the-docker-daemon
  # Just make sure you tag your Docker image with something other than ‘latest’
  # and use that tag while you pull the image
  TAG="test"

  docker tag ${DOCKER_IMAGE}:latest ${DOCKER_IMAGE}:${TAG}

else
  TAG="prod"

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
  kubectl config set-context ${ALIEN_CLUSTER}
fi

if [ ${DELETE} -eq 1 ]; then
  set +x
  log "Deleting Service: ${SERVICE_CONF}"
  set -x

  kubectl delete -f ${SERVICE_CONF}
fi

POD=$(kubectl get pods -l run=${RUN_LABEL} -o name)
if [ -z "${POD}" ]; then

  # Patch config file for minikube repo.
  if [ ${MINIKUBE} -eq 1 ]; then
    CONF=${SERVICE_CONF}
    SERVICE_CONF="/tmp/${SERVICE_CONF}"
    cat ${CONF} | sed -e "s/\(image:\).*/\1 ${DOCKER_IMAGE}:${TAG}/" > ${SERVICE_CONF}

    cat ${SERVICE_CONF}
  fi

  set +x
  log "Creating Service: ${SERVICE_CONF}"
  set -x

  # Create.
  kubectl create -f ${SERVICE_CONF}
else
  set +x
  log "Restarting Service: ${POD}"
  set -x

  # Restart.
  kubectl delete ${POD}
fi

#
# Validate.
#

set +x
duration=$(( SECONDS - start ))
log "OK $(date) [${duration}s]"
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
