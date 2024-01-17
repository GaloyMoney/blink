#!/bin/bash

set -eu

export ref=$(cat ./src-repo/.git/short_ref)

cp -R src-repo/${PROTO_FILES_SRC_PATH}/* repo/core/api/${PROTO_FILES_DEST_PATH}

pushd repo/core/api

if [[ -n "${BUF_CONFIG_PATH:-}" ]]; then
  pnpm install
  export PATH=$PATH:$(pwd)/node_modules/.bin
  pushd "${BUF_CONFIG_PATH}/"
  buf generate
fi

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
  git commit -m "chore(deps): bump ${PROTO_NAME} proto to '${ref}'" || true
)
