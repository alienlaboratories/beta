#!/bin/sh

#
# Test all modules.
#

MODULES="api client core scheduler services util"

for mod in ${MODULES[@]}; do
  echo
  echo "### update [$mod] ###"
  echo

  pushd sub/$mod
  npm test
  popd
done
