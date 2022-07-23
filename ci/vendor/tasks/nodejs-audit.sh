#!/bin/bash

set -eu

pushd repo

yarn audit --level critical
if [[ $? -ge 16 ]]
  exit 1
fi
