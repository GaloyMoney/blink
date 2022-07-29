#!/bin/bash

set -eu

export REPO_PATH=repo

. pipeline-tasks/ci/vendor/tasks/helpers.sh

unpack_deps

pushd repo

make check-code
