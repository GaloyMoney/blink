#!/usr/bin/env bats

load "helpers/setup-and-teardown"

setup_file() {
  clear_cache
  reset_redis

  bitcoind_init
  start_trigger
  start_server

  initialize_user_from_onchain "$ALICE_TOKEN_NAME" "$ALICE_PHONE" "$CODE"
}

teardown_file() {
  stop_trigger
  stop_server
}


@test "push-notification-settings: set and get" {
  token_name="$ALICE_TOKEN_NAME" 

  variables=$( 
      jq -n \
      '{input: { pushNotificationsEnabled: true, disabledPushNotificationTypes: [ "Circles" ] }}')

  exec_graphql "$token_name" 'account-update-push-notification-settings' "$variables"

  disabled_notification="$(graphql_output '.data.accountUpdatePushNotificationSettings.account.pushNotificationSettings.disabledPushNotificationTypes[0]')"
  [[ "$disabled_notification" == "Circles" ]] || exit 1
}
