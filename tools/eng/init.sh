#!/bin/sh

#
# Install common modules required by Grunt.
#

MODULES="api client core scheduler services util"

for mod in ${MODULES[@]}; do
  pushd sub/$mod
  npm install --save-dev grunt grunt-dev-update
  popd
done
