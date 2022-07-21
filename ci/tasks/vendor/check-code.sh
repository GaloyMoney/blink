#!/bin/bash

set -eu

. pipeline-tasks/ci/tasks/vendor/helpers.sh

unpack_deps


pushd repo

make check-code
