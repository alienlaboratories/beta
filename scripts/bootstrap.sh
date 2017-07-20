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

  find . -path */node_modules -prune -o -name package-lock.json -print | rm

# find . -path */node_modules -prune -o -name yarn.lock -print
fi

#===============================================================================
# Bootstrap.
# NOTE: Hoist is required (for server apps) to ensure there aren't multiple
# copies of modules across different packages (esp. important for graphql, aws-sdk).
#===============================================================================

lerna bootstrap --hoist

#MODULES=$(lerna ls | cut -d' ' -f1)
#for i in ${MODULES};
#do
#  echo "### $i ###"
#  lerna bootstrap --concurrency=1 --hoist --scope=$i
#done

# TODO(burdon): https://github.com/lerna/lerna/issues/889
# yarn

npm update

echo "OK: $(date) [$(( SECONDS - start ))s]"
