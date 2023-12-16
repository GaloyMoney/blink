LNDS_REST_LOG=".e2e-lnds-rest.log"

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

lnd_outside_rest() {
  local route=$1
  local endpoint="https://localhost:8080/$route"

  local data=$2

  local macaroon_hex=$(
    docker exec "${COMPOSE_PROJECT_NAME}-lnd-outside-1-1" \
      xxd -p -c 10000 /root/.lnd/admin.macaroon
  )

  docker exec "${COMPOSE_PROJECT_NAME}-lnd-outside-1-1" \
    curl -s \
      --cacert /root/.lnd/tls.cert \
      -H "Grpc-Metadata-macaroon: $macaroon_hex" \
      ${data:+ -X POST -d $data} \
      "$endpoint" \
  > "$LNDS_REST_LOG"
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
