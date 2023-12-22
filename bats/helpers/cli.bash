bitcoin_cli() {
  docker exec "${COMPOSE_PROJECT_NAME}-bitcoind-1" bitcoin-cli $@
}

lnd_cli() {
  docker exec "${COMPOSE_PROJECT_NAME}-lnd1-1" \
    lncli \
      --macaroonpath /root/.lnd/admin.macaroon \
      --tlscertpath /root/.lnd/tls.cert \
      $@
}

lnd_outside_cli() {
  docker exec "${COMPOSE_PROJECT_NAME}-lnd-outside-1-1" \
    lncli \
      --macaroonpath /root/.lnd/admin.macaroon \
      --tlscertpath /root/.lnd/tls.cert \
      $@
}

bria_cli() {
 docker exec "${COMPOSE_PROJECT_NAME}-bria-1" bria $@ 
}

tilt_cli() {
  tilt $@
}

mongo_cli() {
  docker exec "${COMPOSE_PROJECT_NAME}-mongodb-1" mongosh --quiet mongodb://localhost:27017/galoy --eval $@
}

redis_cli() {
  docker exec "${COMPOSE_PROJECT_NAME}-redis-1" redis-cli $@
}
