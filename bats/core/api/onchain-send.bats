#!/usr/bin/env bats

load "../../helpers/auth.bash"
load "../../helpers/funding/onchain.bash"

setup_file() {
  create_user 'alice'
  fund_user_onchain 'alice' 'btc_wallet'
}

@test "one" {
  exit 1
}
