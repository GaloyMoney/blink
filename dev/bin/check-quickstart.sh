#!/bin/bash

set -e

export GALOY_QUICKSTART_PATH="./"

pushd quickstart
docker compose pull
docker compose up -d

./bin/quickstart.sh
