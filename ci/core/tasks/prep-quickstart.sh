#!/bin/bash

export api_digest=$(cat ./api-edge-image/digest | sed 's/:/@/')
export trigger_digest=$(cat ./api-trigger-edge-image/digest | sed 's/:/@/')
export migrate_digest=$(cat ./api-migrate-edge-image/digest | sed 's/:/@/')

pushd repo/quickstart || exit 1

./bin/bump-galoy-git-ref.sh "$(git rev-parse --verify HEAD)"

./bin/bump-galoy-image-digest.sh "api" "$api_digest"
./bin/bump-galoy-image-digest.sh "trigger" "$trigger_digest"
./bin/bump-mongodb-migrate-image-digest.sh "$migrate_digest"
make re-render

pushd ../

git add -A
git commit -m "chore(release): [ci skip] bump quickstart image to ${api_digest}"
