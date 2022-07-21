#!/bin/bash

set -eu

. pipeline-tasks/ci/vendor/tasks/helpers.sh

unpack_deps


pushd repo

make check-code
