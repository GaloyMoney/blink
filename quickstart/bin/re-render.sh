#!/bin/bash

set -e

REPO_ROOT=$(git rev-parse --show-toplevel)
GALOY_ROOT_DIR=${REPO_ROOT}/quickstart/galoy

pushd ${REPO_ROOT}/quickstart

ytt -f vendir > vendir.yml
vendir sync

ytt -f ./docker-compose.tmpl.yml -f ${GALOY_ROOT_DIR}/docker-compose.yml -f ${GALOY_ROOT_DIR}/docker-compose.override.yml > docker-compose.yml

pushd ${GALOY_ROOT_DIR}
source .env
mkdir -p "${GALOY_ROOT_DIR}/../vendor/galoy-quickstart/env"

export OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-agent:4318
envsubst < .env.ci | grep -v '^LND2' > ${GALOY_ROOT_DIR}/../.env.galoy
