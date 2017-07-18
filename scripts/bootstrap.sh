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
fi

#===============================================================================
# Bootstrap.
#===============================================================================

# NOTE: hoist is required for node (server) apps (client can us webpack alias).
#lerna bootstrap --hoist=graphql --loglevel=debug

# TODO(burdon): Bug installing app-server/winston.
#lerna ls | cut -d' ' -f1 | xargs lerna bootstrap --hoist=graphql --scope

MODULES=$(lerna ls | cut -d' ' -f1)
for i in ${MODULES};
do
  echo "### $i ###"
  lerna bootstrap --concurrency=1 --hoist=graphql --scope=$i
done

# TODO(burdon): https://github.com/lerna/lerna/issues/889
# yarn

npm update

echo "OK: $(date) [$(( SECONDS - start ))s]"
