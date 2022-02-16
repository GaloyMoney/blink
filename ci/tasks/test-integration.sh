#!/bin/bash

set -eu
source /docker-lib.sh
start_docker
. pipeline-tasks/ci/tasks/helpers.sh
unpack_deps
docker compose up integration-deps -d
make integration-in-ci
docker compose down
docker volume rm $(docker volume ls -q)
