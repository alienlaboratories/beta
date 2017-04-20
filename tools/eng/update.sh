#!/usr/bin/env bash

#
# Workspace (manages npm link with transitive closure).
# NOTE: This may take 5-10 minutes on first install.
# https://github.com/mariocasciaro/npm-workspace
#
# npm link causes multiple copies of modules to appear (each has their own global variables).
# https://facebook.github.io/react/warnings/refs-must-have-owner.html#multiple-copies-of-react
#

WORKSPACE_MODULES=( "web" )

for mod in ${WORKSPACE_MODULES[@]}; do
  pushd sub/$mod
  npm-workspace install
  popd
done

#
# List and update deps.
#

MODULES=( "core" "web" )

UPDATE=0
PROMPT=0
for i in "$@"
do
case $i in
  --update)
  UPDATE=1
  ;;

  --prompt)
  PROMPT=1
  ;;
esac
done

for mod in "${MODULES[@]}"; do
  echo "### [$mod] ###"
  pushd sub/$mod

  grunt npm-outdated

  if [ $UPDATE -eq 1 ]; then
    echo "Updating $@"
    grunt npm-update
  fi

  if [ $PROMPT -eq 1 ]; then
    echo "Updating $@"
    grunt npm-prompt
  fi

  npm prune

  popd
done
