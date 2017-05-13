#!/usr/bin/env bash

#
# Workspace (manages npm link with transitive closure).
# NOTE: This may take 5-10 minutes on first install.
# https://github.com/mariocasciaro/npm-workspace
#
# npm link causes multiple copies of modules to appear (each has their own global variables).
# https://facebook.github.io/react/warnings/refs-must-have-owner.html#multiple-copies-of-react
#

MODULES=$(ls sub)

for mod in ${MODULES[@]}; do
  echo
  echo "### npm-workspace [$mod] ###"
  echo

  pushd sub/$mod
  npm-workspace install
  npm update
  popd
done

#
# List and update deps.
#

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

for mod in ${MODULES[@]}; do
  echo
  echo "### update [$mod] ###"
  echo

  pushd sub/$mod

  if [ $UPDATE -eq 1 ]; then
    echo "Updating $@"
    grunt npm-update

  elif [ $PROMPT -eq 1 ]; then
    echo "Updating $@"
    grunt npm-prompt

  else
    grunt npm-outdated
  fi

  npm prune

  popd
done

