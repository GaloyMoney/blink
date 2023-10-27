#!/bin/bash

set -eu

pushd repo/core/api

pnpm install
make unit-in-ci
