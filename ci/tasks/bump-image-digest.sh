#!/bin/bash

set -eu

digest=$(cat ./edge-image/digest)

pushd charts-repo

sed -i'' "s/^  digest:.*/  digest: \"${tag}\"/" ./charts/galoy/values.yaml

if [[ -z $(git config --global user.email) ]]; then
  git config --global user.email "bot@galoy.io"
fi
if [[ -z $(git config --global user.name) ]]; then
  git config --global user.name "CI Bot"
fi

(
  cd $(git rev-parse --show-toplevel)
  git merge --no-edit ${BRANCH}
  git add -A
  git status
  git commit -m "Bump image digest to '${digest}'"
)
