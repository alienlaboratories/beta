#!/usr/bin/env bash

BUILD=0
for i in "$@"
do
case $i in
  --build)
  BUILD=1
  ;;
esac
done

set -e
set -x

#
# Tests the server bundle (use to test Dockerfile).
#

if [ ${BUILD} -eq 1 ]; then
  webpack
fi

ROOT=`pwd`

export APP_SERVER_NODE_MODULES="${ROOT}/node_modules"

export APP_SERVER_ASSETS_DIR="${ROOT}/dist"
export APP_SERVER_CONF_DIR="${ROOT}/../../conf"
export APP_SERVER_DATA_DIR="${ROOT}/../../data"
export APP_SERVER_PUBLIC_DIR="${ROOT}/src/server/public"
export APP_SERVER_VIEWS_DIR="${ROOT}/src/server/views"

node ./dist/server.bundle.js
