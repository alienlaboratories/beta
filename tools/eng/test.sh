#!/bin/sh

#
# Test all modules.
#

MODULES=$(ls sub)

for mod in ${MODULES[@]}; do
  pushd sub/$mod
  npm test
  popd
done
