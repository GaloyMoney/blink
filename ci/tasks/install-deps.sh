#!/bin/bash

set -eu

tar_out="$(pwd)/bundled-deps"

pushd deps/core/api
yarn install
git log --pretty=format:'%h' -n 1 > gitref

tar -zcvf "${tar_out}/bundled-deps-v$(cat ../../../deps-version/number)-$(cat gitref).tgz" . > /dev/null

popd
