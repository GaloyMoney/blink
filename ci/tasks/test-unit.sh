#!/bin/bash

set -eu

. pipeline-tasks/ci/tasks/helpers.sh

unpack_deps

pushd repo/core/api

make unit-in-ci
