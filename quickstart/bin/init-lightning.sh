#!/bin/bash

set -e

COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-quickstart}"

DIR="$(dirname "$(readlink -f "$BASH_SOURCE")")"
source ${DIR}/helpers.sh

echo "Running getinfo on lnd..."
lnd_cli getinfo
echo "DONE"
echo "Opening lnd-outside -> lnd channel"
init_lnd_channel
echo "DONE"
