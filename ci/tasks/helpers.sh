#!/bin/bash


if [[ -z $(git config --global user.email) ]]; then
  git config --global user.email "bot@galoy.io"
fi
if [[ -z $(git config --global user.name) ]]; then
  git config --global user.name "CI Bot"
fi

function unpack_deps() {

  echo "Unpacking deps... "

  pushd ${REPO_PATH:-repo/core/api} > /dev/null

  tar -zxvf ../../../bundled-deps/bundled-deps-*.tgz ./node_modules/ ./yarn.lock > /dev/null

  if [[ "$(git status -s -uno)" != "" ]]; then
    echo "Extracting deps has created a diff - deps are not in sync"
    git --no-pager diff
    exit 1;
  fi

  echo "Done!"

  popd
}
