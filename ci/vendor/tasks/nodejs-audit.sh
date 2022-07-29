#!/bin/bash

set -eu

REPO_ROOT=${REPO_ROOT:-./}
LEVEL=${LEVEL:-high}

pushd ${REPO_ROOT}

set +e
yarn audit --groups dependencies --level ${LEVEL}
audit_return=$?
set -e

# See https://classic.yarnpkg.com/lang/en/docs/cli/audit for explanation of exit codes
if [[ ${LEVEL} == "critical" ]] && [[ ${audit_return} -ge 16 ]]; then
  exit 1
elif [[ ${LEVEL} == "high" ]] && [[ ${audit_return} -ge 8 ]]; then
  exit 1
fi
