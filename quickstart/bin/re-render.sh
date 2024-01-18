#!/bin/bash

set -e

REPO_ROOT=$(git rev-parse --show-toplevel)
DEV_ROOT_DIR=${REPO_ROOT}/quickstart/dev

pushd ${REPO_ROOT}/quickstart

ytt -f vendir > vendir.yml
vendir sync

ytt -f ./docker-compose.tmpl.yml -f ${DEV_ROOT_DIR}/docker-compose.deps.yml > docker-compose.yml
