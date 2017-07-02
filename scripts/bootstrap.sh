#!/usr/bin/env bash

start=$SECONDS

# TODO(burdon): Webpack alias instead?
#lerna bootstrap --hoist=graphql --loglevel=debug

# TODO(burdon): Bug installing app-server/winston.
lerna ls | cut -d' ' -f1 | xargs lerna bootstrap --hoist=graphql --scope

# TODO(burdon): https://github.com/lerna/lerna/issues/889
yarn

echo "OK: $(date) [$(( SECONDS - start ))s]"
