#!/bin/sh

#
# Install common modules required by Grunt.
#

MODULES=( "core" "web" )

for mod in ${MODULES[@]}; do
  pushd sub/$mod

  npm install --save-dev grunt grunt-dev-update

  popd
done
