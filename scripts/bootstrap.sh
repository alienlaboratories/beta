#!/usr/bin/env bash

start=$SECONDS

# TODO(burdon): Webpack alias instead?
lerna bootstrap --hoist graphql

echo "OK: $(date) [$(( SECONDS - start ))s]"
