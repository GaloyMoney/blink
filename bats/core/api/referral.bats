#!/usr/bin/env bats
load "../../helpers/user.bash"

@test "referral: alice is using bob referral" {
  local token_name=$1
  local phone=$(random_phone)

  login_user "$token_name" "$phone" "bob"
}
