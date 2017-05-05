#!/bin/sh

#
# Lint all modules.
#

MODULES="client core util"

for mod in ${MODULES[@]}; do
  pushd sub/$mod
  npm run lint
  popd
done

