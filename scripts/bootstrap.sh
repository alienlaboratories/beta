#!/usr/bin/env bash

start=$SECONDS

#
# Yarn replaces lerna as the package manager for monospaces.
#

yarn install

# Grunt doesn't work if plugins are hoisted.
# TODO(burdon): https://github.com/yarnpkg/yarn/issues/4049

for dir in ./sub/*/
do
  dir=${dir%*/}
  package=${dir##*/}

  if [ -e ${dir}/Gruntfile.js ]
  then
    echo "Linking grunt: ${package}"
    ln -fs ../../../node_modules/grunt sub/${package}/node_modules/
  fi
done

echo "OK: $(date) [$(( SECONDS - start ))s]"
