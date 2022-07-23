#!/bin/bash

set -eu

LEVEL=${LEVEL:?high}

pushd repo

yarn audit --level ${LEVEL}

# See https://classic.yarnpkg.com/lang/en/docs/cli/audit for explanation of exit codes
if [[ ${LEVEL} == "critical" ]] && [[ $? -ge 16 ]]
then
  exit 1
elif [[ $? -ge 8 ]]
then
  exit 1
fi
