#!/bin/bash

set -eu

echo "Unpacking deps... "

tar -zxvf bundled-deps/bundled-deps-*.tgz ./node_modules/ ./yarn.lock -C repo/ > /dev/null

pushd repo > /dev/null

if [[ "$(git status -s -uno)" != "" ]]; then
  echo "Extracting deps has created a diff - deps are not in sync"
  git --no-pager diff
  exit 1;
fi

echo "Done!"
