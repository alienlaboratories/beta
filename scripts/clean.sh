#!/usr/bin/env bash

lerna clean --yes
lerna bootstrap --hoist graphql

pushd sub/api
npm run update-schema
popd
