#!/bin/bash

set -eu

export ref=$(cat ./src-repo/.git/short_ref)
cp src-repo/${PROTO_FILE_SRC_PATH} repo/${PROTO_FILE_DEST_PATH}

cd repo

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
  git commit -m "chore(deps): bump dealer proto to '${ref}'"
)
