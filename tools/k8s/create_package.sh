#!/usr/bin/env bash

function join { local IFS="$1"; shift; echo "$*"; }

#
# Merge package.json from all modules (since we use npm link).
# We use nodeExternals in webpack so that modules are not bundled.
#

PACKAGE_DIRS=${PACKAGE_DIRS:-"core util"}

I=0
JQ_SPEC=".[0]"
JQ_PACKAGES="./package.json"
for mod in ${PACKAGE_DIRS[@]}; do
  (( I += 1 ))
  JQ_SPEC="${JQ_SPEC} * .[${I}]"
  JQ_PACKAGES="../$mod/package.json $JQ_PACKAGES"
done

#
# Strip devDependencies and alien source modules.
# Otherwise: npm ERR! 404 'alien-xxx' is not in the npm registry.
#

MODULES="alien-api alien-client alien-core alien-services alien-util alien-worker"

JQ_DELETE=""
for mod in ${MODULES[@]}; do
  JQ_DELETE="$JQ_DELETE .dependencies.\"$mod\""
done

jq --sort-keys -s "${JQ_SPEC}" ${JQ_PACKAGES} \
  | jq '{ name, version, dependencies }' \
  | jq "del($(join , ${JQ_DELETE}))"
