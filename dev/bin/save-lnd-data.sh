#!/bin/bash

# script to generate the lnd wallets for testing

NETWORK=regtest
mkdir ../lnd/$NETWORK 2>/dev/null

fetch_lnd_data() {
  local container_id=$(docker ps -q -f status=running -f name="galoy-$1-")
  if [ -n "${container_id}" ]; then
    # wallet.db
    docker cp $container_id:/root/.lnd/data/chain/bitcoin/$NETWORK/wallet.db ../lnd/$NETWORK/$1.wallet.db
    # macaroons.db
    docker cp $container_id:/root/.lnd/data/chain/bitcoin/$NETWORK/macaroons.db ../lnd/$NETWORK/$1.macaroons.db
    # admin.macaroon
    docker cp $container_id:/root/.lnd/data/chain/bitcoin/$NETWORK/admin.macaroon ../lnd/$NETWORK/$1.admin.macaroon
    # base64 macaroon
    base64 ../lnd/$NETWORK/$1.admin.macaroon | tr -d '\n\r' > "../lnd/$NETWORK/$1.admin.macaroon.base64"
    # pubkey
    docker exec ${container_id} lncli -n $NETWORK getinfo 2> /dev/null | jq -r .identity_pubkey > ../lnd/$NETWORK/$1.pubkey
  fi
}

for i in lnd1 lnd2 lnd-outside-1 lnd-outside-2; do
  echo "Saving data for $i"
  fetch_lnd_data "$i"
done
