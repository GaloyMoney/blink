#!/bin/bash

REPO_ROOT=$(git rev-parse --show-toplevel)

build_args=$(
  "$REPO_ROOT/dev/bin/prepare-tilt-ci-with-build.sh" "$@" \
    | grep "build_args=" \
    | cut -d '=' -f 2-
)
buck2 build $build_args

"$REPO_ROOT/dev/bin/tilt-ci.sh" "$@"
