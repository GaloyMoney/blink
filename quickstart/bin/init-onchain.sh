#!/bin/bash

set -e

COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-quickstart}"

DIR="$(dirname "$(readlink -f "$BASH_SOURCE")")"
source ${DIR}/helpers.sh

echo "Seeding some regtest blocks..."

bitcoin_cli createwallet "outside" || true
bitcoin_cli -generate 200 > /dev/null 2>&1

bitcoin_signer_cli createwallet "dev" || true
bitcoin_signer_cli -rpcwallet=dev importdescriptors "$(cat $GALOY_DIR/dev/config/bitcoind/bitcoind_signer_descriptors.json)"

echo "Checking that bria is running..."

for i in {1..20}; do
  bria_cli wallet-balance -w dev-wallet && break
  sleep 1
done
bria_cli wallet-balance -w dev-wallet || exit 1

echo "DONE"
