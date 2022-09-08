#!/bin/bash

# script to generate the loop wallets for testing
NETWORK=regtest
mkdir ../lnd/loop/$NETWORK 2>/dev/null

fetch_loop_data() {
  local container_id=$(docker ps -q -f status=running -f name="galoy-$1")
  if [ -n "${container_id}" ]; then
    # loop.db
    docker cp $container_id:/root/.loop/$NETWORK/loop.db ../lnd/loop/$NETWORK/$1.loop.db
    # macaroons.db
    docker cp $container_id:/root/.loop/$NETWORK/macaroons.db ../lnd/loop/$NETWORK/$1.macaroons.db
    # loop.macaroon
    docker cp $container_id:/root/.loop/$NETWORK/loop.macaroon ../lnd/loop/$NETWORK/$1.loop.macaroon
    # base64 macaroon
    base64 ../lnd/loop/$NETWORK/$1.loop.macaroon | tr -d '\n\r' > "../lnd/loop/$NETWORK/$1.loop.macaroon.base64"
    # loop tls cert
    docker cp $container_id:/root/.loop/$NETWORK/tls.cert ../lnd/loop/$NETWORK/$1.tls.cert
    # base64 loop tls cert
    base64 ../lnd/loop/$NETWORK/$1.tls.cert | tr -d '\n\r' > "../lnd/loop/$NETWORK/$1.tls.cert.base64"
    # loop tls key
    docker cp $container_id:/root/.loop/$NETWORK/tls.key ../lnd/loop/$NETWORK/$1.tls.key
  fi
}

for i in loopd1-1 loopd2-1; do
  echo "Saving data for $i"
  fetch_loop_data "$i"
done
