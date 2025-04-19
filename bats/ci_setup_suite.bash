#!/bin/bash

export REPO_ROOT=$(git rev-parse --show-toplevel)
source "${REPO_ROOT}/bats/helpers/_common.bash"

TILT_PID_FILE="${BATS_ROOT_DIR}/.tilt_pid"

setup_suite() {
  buck2 build \
    //core/api //core/api-ws-server //core/api-trigger //core/api-exporter \
    //apps/dashboard //apps/consent //apps/pay //apps/admin-panel //apps/map //apps/voucher \
    //core/api-keys //core/notifications \
    //bats/helpers/callback:run //bats/helpers/subscriber:run //bats/helpers/totp:generate
  background buck2 run //dev:up -- --bats=True > "${REPO_ROOT}/bats/.e2e-tilt.log"
  echo $! > "$TILT_PID_FILE"
  await_notifications_is_up
  await_api_keys_is_up
  await_api_is_up
  await_pay_is_up
}

teardown_suite() {
  if [[ -f "$TILT_PID_FILE" ]]; then
    kill "$(cat "$TILT_PID_FILE")" > /dev/null || true
  fi

  buck2 run //dev:down
}

await_api_is_up() {
  api_is_up() {
    exec_graphql 'anon' 'globals'
    network="$(graphql_output '.data.globals.network')"
    [[ "${network}" = "regtest" ]] || exit 1
  }

  retry 360 5 api_is_up
}

await_pay_is_up() {
  pay_is_up() {
    curl localhost:3002 || exit 1
  }

  retry 360 5 pay_is_up
}

await_api_keys_is_up() {
  api_keys_is_up() {
    curl localhost:5397/auth/check || exit 1
  }

  retry 360 5 api_keys_is_up
}

await_notifications_is_up() {
  notifications_is_up() {
    nc -zv localhost 6685 || exit 1
  }

  retry 360 5 notifications_is_up
}
