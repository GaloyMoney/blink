#!/bin/bash

set -eu

export REPO_PATH=repo/core/api

. pipeline-tasks/ci/tasks/helpers.sh

unpack_deps

pushd repo/core/api

make check-code
