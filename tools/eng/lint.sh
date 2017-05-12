#!/bin/sh

#
# Lint all modules.
#

MODULES="api client core services util"

for mod in ${MODULES[@]}; do
  echo
  echo "### update [$mod] ###"
  echo

  pushd sub/$mod
  npm run lint
  popd
done

