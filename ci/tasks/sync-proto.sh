#!/bin/bash

set -eu

export ref=$(cat ./src-repo/.git/short_ref)

if [ "$RUN_BUF_GENERATE" == "true" ]; then
  pushd src-repo
  yarn install
  export PATH=$PATH:$(pwd)/node_modules/.bin
  pushd ${PROTO_FILES_SRC_PATH}/
  buf generate
  popd
  popd
fi

cp -R src-repo/${PROTO_FILES_SRC_PATH}/* repo/${PROTO_FILES_DEST_PATH}

cd repo/${PROTO_FILES_DEST_PATH}

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
  git commit -m "chore(deps): bump ${MODULE} proto to '${ref}'"
)
