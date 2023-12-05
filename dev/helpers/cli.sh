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

hydra_cli() {
  docker exec "${COMPOSE_PROJECT_NAME}-hydra-1" hydra "$@"
}

kratos_pg() {
  DB_USER="dbuser"
  DB_NAME="default"

  docker exec "${COMPOSE_PROJECT_NAME}-kratos-pg-1" psql -U $DB_USER -d $DB_NAME -t "$@"
}

mongo_cli() {
  docker exec "${COMPOSE_PROJECT_NAME}-mongodb-1" mongosh --quiet mongodb://localhost:27017/galoy --eval $@
}
