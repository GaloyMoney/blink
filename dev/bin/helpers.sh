#!/bin/bash

COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-quickstart}"

bitcoin_cli() {
  docker exec "${COMPOSE_PROJECT_NAME}-bitcoind-1" bitcoin-cli "$@"
}

bitcoin_signer_cli() {
  docker exec "${COMPOSE_PROJECT_NAME}-bitcoind-signer-1" bitcoin-cli "$@"
}

bria_cli() {
  docker exec "${COMPOSE_PROJECT_NAME}-bria-1" bria "$@"
}
