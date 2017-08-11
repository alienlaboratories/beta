#!/usr/bin/env bash

start=$SECONDS

#
# Options
#

CLEAN=0

for i in "$@"
do
case $i in
  --clean)
  CLEAN=1
  ;;
esac
done

if [ ${CLEAN} -eq 1 ]; then
  lerna clean --yes
  find . -name yarn.json | xargs rm
fi

#
# Yarn replaces lerna as the package manager for monospaces.
# https://github.com/yarnpkg/website/pull/580/commits/85747b353125aded8f28bab4970a1177ba6f815e
#

yarn config set workspaces-experimental true

yarn install

# Grunt doesn't work if plugins are hoisted.
# TODO(burdon): https://github.com/yarnpkg/yarn/issues/4049

for dir in ./sub/*/
do
  dir=${dir%*/}
  package=${dir##*/}

  mkdir -p ${dir}/node_modules

  if [ -e ${dir}/Gruntfile.js ]
  then
    echo "Linking grunt: ${package}"
    ln -fs ../../../node_modules/grunt sub/${package}/node_modules/

    # E.g., for webpack-dev-server
    ln -fs ../../../node_modules/.bin sub/${package}/node_modules/.bin
  fi
done

echo "OK: $(date) [$(( SECONDS - start ))s]"
