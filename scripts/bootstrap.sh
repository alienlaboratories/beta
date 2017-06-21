#!/usr/bin/env bash

start=$SECONDS

# TODO(burdon): Webpack alias instead?
lerna bootstrap --hoist graphql

# TODO(burdon): https://github.com/lerna/lerna/issues/889
yarn

echo "OK: $(date) [$(( SECONDS - start ))s]"
