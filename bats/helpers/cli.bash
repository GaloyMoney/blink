bitcoin_cli() {
  docker exec "${COMPOSE_PROJECT_NAME}-bitcoind-1" bitcoin-cli $@
}

bria_cli() {
 docker exec "${COMPOSE_PROJECT_NAME}-bria-1" bria $@ 
}

tilt_cli() {
  tilt $@
}
