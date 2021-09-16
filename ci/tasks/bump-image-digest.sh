#!/bin/bash

set -eu

digest=$(cat ./edge-image/digest)
ref=$(cat ./repo/.git/short_ref)

pushd charts-repo

sed -i'' "s/^  digest:.*/  digest: \"${digest}\"/" ./charts/galoy/values.yaml
old_ref=$(grep '# git_ref' charts/galoy/values.yaml | sed 's/.*://')
sed -i'' "s/^  # git_ref:.*/  # git_ref: \"${ref}\"/" ./charts/galoy/values.yaml

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
  git commit -m "Bump galoy image to '${digest}'"
)
