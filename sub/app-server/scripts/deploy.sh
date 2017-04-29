#!/usr/bin/env bash

#===============================================================================
# Deploy Script.
#
# This script can be used to create or update a running service on the cluster,
# or to test a new image on the local minikube (by building the docker image
# directly inside minikube's local docker daemon.)
#===============================================================================

# TODO(burdon): Factor out with other containers.

PS4=''  # Don't print "+" in trace.

set -e  # Stop on error.

function join { local IFS="$1"; shift; echo "$*"; }

function log { echo; echo "###"; echo "### $1"; echo "###"; echo; }

start=$SECONDS

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

# TODO(burdon): Standardize tools env.
CLUSTER="beta.kube.robotik.io"

log "Setting context"

if [ ${MINIKUBE} -eq 1 ]; then
  kubectl config set-context minikube
else
  kubectl config set-context ${CLUSTER}
fi

#===============================================================================
# Build.
#===============================================================================

mkdir -p ./dist

#
# Merge package.json from all modules (since we use npm link).
# We use nodeExternals in webpack so that modules are not bundled.
#

MODULES="api core services util"

I=0
JQ_SPEC=".[0]"
JQ_PACKAGES="./package.json"
for mod in ${MODULES[@]}; do
  (( I += 1 ))
  JQ_SPEC="${JQ_SPEC} * .[${I}]"
  JQ_PACKAGES="../$mod/package.json $JQ_PACKAGES"
done

#
# Then Strip devDependencies and alien source modules.
#

MODULES="alien-api alien-core alien-client alien-services alien-util"

JQ_DELETE=""
for mod in ${MODULES[@]}; do
  JQ_DELETE="$JQ_DELETE .dependencies.\"$mod\""
done

jq --sort-keys -s "${JQ_SPEC}" ${JQ_PACKAGES} \
  | jq '{ name, version, dependencies }' \
  | jq "del($(join , ${JQ_DELETE}))" \
  > dist/package.json

#cat dist/package.json

#
# Build Node assets.
#

if [ ${BUILD} -eq 1 ]; then
  set +x
  log "Building Assets"
  set -x

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

# https://console.aws.amazon.com/ecs/home?region=us-east-1#/repositories
AWS_ECS_DOCKER_REPO="861694698401.dkr.ecr.us-east-1.amazonaws.com"

# Minikube runs insecure Docker daemon.
# https://mtpereira.com/local-development-k8s.html
MINIKUBE_DOCKER_REPO="localhost:5000"

DOCKER_IMAGE="alien-app-server"

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

    cat ${MINIKUBE_DOCKERFILE}

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
# kubectl delete -f ../../ops/conf/k8s/alien-app-server.yml
#===============================================================================

RUN_LABEL="alien-app-server"

CONF=../../ops/conf/k8s/alien-app-server.yml

if [ ${DELETE} -eq 1 ]; then
  set +x
  log "Deleting Service: ${CONF}"
  set -x

  kubectl delete -f ${CONF}
fi

POD=$(kubectl get pods -l run=${RUN_LABEL} -o name)
if [ -z "${POD}" ]; then

  # Patch config file for minikube repo.
  if [ ${MINIKUBE} -eq 1 ]; then
    PROD_CONF=${CONF}
    CONF=/tmp/alien-app-server.yml
    cat ${PROD_CONF} | sed -e "s/image: \(.*.amazonaws.com\)/image: ${DOCKER_IMAGE}:${TAG}/g" > ${CONF}
  fi

  set +x
  log "Creating Service: ${CONF}"
  set -x

  # Create.
  kubectl create -f ${CONF}
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
log "OK [${duration}s]"
set -x

kubectl describe services ${RUN_LABEL}

kubectl get pods

# TODO(burdon): Loop to curl status (check version).
if [ ${MINIKUBE} -eq 1 ]; then
  minikube service ${RUN_LABEL} --url
  curl -s $(minikube service alien-app-server --url)/status | jq
fi

set +x
echo
echo "kubectl logs $(kubectl get pods -o name | grep ${DOCKER_IMAGE}) -f"
echo
set -x
