#!/bin/bash

set -eu

export REPO_PATH=repo/core/api

. pipeline-tasks/ci/vendor/tasks/helpers.sh

unpack_deps

pushd repo

make check-code
