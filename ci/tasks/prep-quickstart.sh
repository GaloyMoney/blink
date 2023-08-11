#!/bin/bash

export digest=$(cat ./edge-image/digest | sed 's/:/@/')
export migrate_digest=$(cat ./migrate-edge-image/digest | sed 's/:/@/')

pushd repo/quickstart

./bin/bump-galoy-git-ref.sh "$(git rev-parse --verify HEAD)"

./bin/bump-galoy-image-digest.sh "$digest"
./bin/bump-mongodb-migrate-image-digest.sh "$migrate_digest"
make re-render

pushd ../

git add -A
git commit -m "chore(release): bump quickstart image to ${digest}"
