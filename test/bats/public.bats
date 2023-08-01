#!/usr/bin/env bats

load "helpers/setup-and-teardown"

setup_file() {
  start_ws_server
  start_server
}

teardown_file() {
  stop_server
  stop_ws_server
}

btc_amount=1000
usd_amount=50

@test "public: can query globals" {
  exec_graphql 'anon' 'globals'
  network="$(graphql_output '.data.globals.network')"
  [[ "${network}" = "regtest" ]] || exit 1
}

@test "public: can subscribe to price" {
  subscribe_to 'anon' price-sub
  retry 10 1 grep 'Data.*\bprice\b' .e2e-subscriber.log

  num_errors=$(
    grep 'Data.*\bprice\b' .e2e-subscriber.log \
      | awk '{print $2}' \
      | jq -r '.data.price.errors | length'
  )
  [[ "$num_errors" == "0" ]] || exit 1

  stop_subscriber
}

@test "public: can subscribe to realtime price" {
  subscribe_to 'anon' real-time-price-sub '{"currency": "EUR"}'
  retry 10 1 grep 'Data.*\brealtimePrice\b.*EUR' .e2e-subscriber.log

  num_errors=$(
    grep 'Data.*\brealtimePrice\b.*EUR' .e2e-subscriber.log \
      | awk '{print $2}' \
      | jq -r '.data.brealtimePrice.errors | length'
  )
  [[ "$num_errors" == "0" ]] || exit 1

  stop_subscriber
}
