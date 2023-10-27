#!/bin/bash

set -eu

pushd repo/core/api

pnpm install
make check-code
