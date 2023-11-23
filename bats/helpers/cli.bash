tilt_cli() {
  tilt $@
}

bria_cli() {
 docker exec "${COMPOSE_PROJECT_NAME}-bria-1" bria $@ 
}

mongo_cli() {
  docker exec "${COMPOSE_PROJECT_NAME}-mongodb-1" mongosh --quiet mongodb://localhost:27017/galoy --eval $@
}

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

lnd2_cli() {
  docker exec "${COMPOSE_PROJECT_NAME}-lnd2-1" \
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

lnd_outside_2_cli() {
  docker exec "${COMPOSE_PROJECT_NAME}-lnd-outside-2-1" \
    lncli \
      --macaroonpath /root/.lnd/admin.macaroon \
      --tlscertpath /root/.lnd/tls.cert \
      $@
}

run_with_lnd() {
  local lnd_name="$1"
  shift  # This will shift away the function name, so $1 becomes the next argument

  if [[ "$lnd_name" == "lnd_cli" ]]; then
    lnd_cli "$@"
  elif [[ "$lnd_name" == "lnd2_cli" ]]; then
    lnd2_cli "$@"
  elif [[ "$lnd_name" == "lnd_outside_cli" ]]; then
    lnd_outside_cli "$@"
  elif [[ "$lnd_name" == "lnd_outside_2_cli" ]]; then
    lnd_outside_2_cli "$@"
  else
    echo "Invalid function name passed!" && return 1
  fi
}
