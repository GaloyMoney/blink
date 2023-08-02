#!/usr/bin/env bats

load "helpers/setup-and-teardown"

@test "cold storage: rebalance hot to cold" {
echo hello
  export LND_HEALTH_REFRESH_TIME_MS=100
  node lib/servers/cron.js
}
