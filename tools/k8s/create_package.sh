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
# Then Strip devDependencies and alien source modules.
#

MODULES="alien-api alien-core alien-client alien-services alien-util"

JQ_DELETE=""
for mod in ${MODULES[@]}; do
  JQ_DELETE="$JQ_DELETE .dependencies.\"$mod\""
done

jq --sort-keys -s "${JQ_SPEC}" ${JQ_PACKAGES} \
  | jq '{ name, version, dependencies }' \
  | jq "del($(join , ${JQ_DELETE}))"
