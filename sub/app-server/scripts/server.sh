#!/usr/bin/env bash

#
# Tests the server bundle (use to test Dockerfile).
#

BUILD=0
for i in "$@"
do
case $i in
  -b|--build)
  BUILD=1
  ;;
esac
done

#
# ENV should closely match Dockerfile.
#

ROOT=`pwd`

export ALIEN_SERVER_ASSETS_DIR="${ROOT}/dist"
export ALIEN_SERVER_CONF_DIR="${ROOT}/../../conf"
export ALIEN_SERVER_DATA_DIR="${ROOT}/../../data"
export ALIEN_SERVER_PUBLIC_DIR="${ROOT}/src/server/public"
export ALIEN_SERVER_VIEWS_DIR="${ROOT}/src/server/views"

set -e
set -x

#
# Build and run.
#

if [ ${BUILD} -eq 1 ]; then
  webpack
fi

node ./dist/server.bundle.js
