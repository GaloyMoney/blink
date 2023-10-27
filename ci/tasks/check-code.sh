#!/bin/bash

set -eu

pushd repo/core/api

pnpm install --frozen-lockfile
make check-code
