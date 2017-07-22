#!/usr/bin/env bash

#===============================================================================
# Options.
#===============================================================================

CLEAN=0

for i in "$@"
do
case $i in
  --clean)
  CLEAN=1
  ;;
esac
done

start=$SECONDS

if [ ${CLEAN} -eq 1 ]; then
  lerna clean --yes

  # These seem to go stale.
  rm package-logk.json
  find . -path */node_modules -prune -o -name package-lock.json -print | rm
fi

#===============================================================================
# Bootstrap.
# NOTE: Hoist is required (for server apps) to ensure there aren't multiple
# copies of modules across different packages (esp. important for graphql, aws-sdk).
#===============================================================================

# Grunt plugins must be local to Gruntfile.
# https://github.com/lerna/lerna#--hoist-glob
lerna bootstrap --hoist --nohoist=grunt-*

# Ensure local modules are installed.
npm update

echo "OK: $(date) [$(( SECONDS - start ))s]"
