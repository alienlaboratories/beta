#!/usr/bin/env bash

start=$SECONDS

lerna clean --yes
lerna bootstrap --hoist graphql

pushd sub/api
npm run update-schema
popd

echo "OK: $(date) [$(( SECONDS - start ))s]"
