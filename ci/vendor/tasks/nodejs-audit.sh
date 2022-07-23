#!/bin/bash

set -eu

REPO_ROOT=${REPO_ROOT:-./}
LEVEL=${LEVEL:-high}

pushd ${REPO_ROOT}

yarn audit --level ${LEVEL}

# See https://classic.yarnpkg.com/lang/en/docs/cli/audit for explanation of exit codes
if [[ ${LEVEL} == "critical" ]] && [[ $? -ge 16 ]]
then
  exit 1
elif [[ $? -ge 8 ]]
then
  exit 1
fi
