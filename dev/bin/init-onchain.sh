#!/bin/bash

set -e

DEV_DIR="$(dirname "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")")"
source "${DEV_DIR}/helpers/cli.sh"

echo "Seeding some regtest blocks..."

bitcoin_cli createwallet "outside" || true
bitcoin_cli -generate 200 > /dev/null 2>&1

bitcoin_signer_cli createwallet "dev" || true
bitcoin_signer_cli -rpcwallet=dev importdescriptors "$(cat ${DEV_DIR}/config/bitcoind/bitcoind_signer_descriptors.json)"

echo "Checking that bria is running..."

for _ in {1..20}; do
  bria_cli wallet-balance -w dev-wallet && break
  sleep 1
done
bria_cli wallet-balance -w dev-wallet || exit 1

echo "DONE"
