#!/bin/bash

set -eu

function make_commit() {
  if [[ -z $(git config --global user.email) ]]; then
    git config --global user.email "bot@galoy.io"
  fi
  if [[ -z $(git config --global user.name) ]]; then
    git config --global user.name "CI Bot"
  fi

  (cd $(git rev-parse --show-toplevel)
    git merge --no-edit ${BRANCH}
    git add -A
    git status
    git commit -m "$1"
  )
}

cd edge-image
cat ./digest
