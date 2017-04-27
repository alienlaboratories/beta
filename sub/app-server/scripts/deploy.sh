#!/usr/bin/env bash

# TODO(burdon): Options.
# TODO(burdon): Factor out with other containers.
# TODO(burdon): Errors.

set -e  # Stop on error.

#===============================================================================
# Options.
#===============================================================================

BUILD=1
LOCAL=0
DELETE=0
for i in "$@"
do
case $i in
  --nobuild)
  BUILD=0
  ;;

  --local)
  LOCAL=1
  ;;

  --delete)
  DELETE=1
  ;;
esac
done

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
  ((I++))
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

function join { local IFS="$1"; shift; echo "$*"; }

jq --sort-keys -s "${JQ_SPEC}" ${JQ_PACKAGES} \
  | jq '{ name, version, dependencies }' \
  | jq "del($(join , ${JQ_DELETE}))" \
  > dist/package.json

cat dist/package.json
echo

#
# Build Node assets.
#

set -x  # Echo.

if [ ${BUILD} -eq 1 ]; then
  webpack
fi

#===============================================================================
# Docker: Build and push image.
#===============================================================================

#
# Copy resources for Dockerfile.
#

cp -R ../../conf dist
cp -R ../../data dist

#
# Build and push Docker image.
# https://console.aws.amazon.com/ecs/home?region=us-east-1#/repositories
#

IMAGE=alien-app-server

AWS_ECS_REPO=861694698401.dkr.ecr.us-east-1.amazonaws.com

if [ ${LOCAL} -eq 1 ]; then

  eval $(minikube docker-env)

  # minikube repo.
  # https://mtpereira.com/local-development-k8s.html
  REPO=localhost:5000
else

  # TODO(burdon): Is this necessary?
  eval $(docker-machine env ${DOCKER_MACHINE})

  # Get token (valid for 12 hours).
  # http://docs.aws.amazon.com/cli/latest/reference/ecr/get-login.html
  # Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?
  set +x
  eval $(aws ecr get-login)
  set -x

  REPO=${AWS_ECS_REPO}
fi

# Create via console.
# https://console.aws.amazon.com/ecs/home
REPO_IMAGE=${REPO}/${IMAGE}

if [ ${BUILD} -eq 1 ]; then
  docker build -t ${IMAGE} .
fi

docker tag ${IMAGE}:latest ${REPO_IMAGE}:latest
docker push ${REPO_IMAGE}:latest


#===============================================================================
# Kubernetes: Create/restart service.
#
# NOTE: Deleting the pod automatically creates a new service.
# NOTE: To actually remnove the service and deployment:
# kubectl delete -f ../../ops/conf/k8s/alien-app-server.yml
#===============================================================================

RUN_LABEL=alien-app-server

CONF=../../ops/conf/k8s/alien-app-server.yml

if [ ${DELETE} -eq 1 ]; then
  kubectl delete -f ${CONF}
fi

POD=$(kubectl get pods -l run=${RUN_LABEL} -o name)
if [ -z "${POD}" ]; then

  if [ ${LOCAL} -eq 1 ]; then
    cat ${CONF} | sed -e 's/image: \(.*.amazonaws.com\)/image: localhost:5000/g' > /tmp/alien-app-server.yml
    CONF=/tmp/alien-app-server.yml
  fi

  # Create.
  kubectl create -f ${CONF}
else
  # Restart.
  kubectl delete ${POD}
fi

#
# Validate.
# TODO(burdon): Loop to curl status (check version).
#

echo

kubectl describe services ${RUN_LABEL}
kubectl get pods -w
