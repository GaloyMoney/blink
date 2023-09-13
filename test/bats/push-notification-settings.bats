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

  # notification_setting="{type: \"Circles\", enabled: false, disabledSubtypes: []}"
  notification_setting=$( 
    jq -n \
    --arg type "Circles" \
    --argjson enabled false \
    --argjson disabledSubtypes "[]" \
    '{type: $type, enabled: $enabled, disabledSubtypes: $disabledSubtypes}' 
  ) 

  variables=$( 
      jq -n \
      --argjson notification_setting "$notification_setting" \
      '{input: {notificationsEnabled: true, notificationSettings: [$notification_setting]}}' 
  )

  exec_graphql "$token_name" 'account-update-push-notification-settings' "$variables"

  wallet_id="$(graphql_output '.data.accountUpdatePushNotificationSettings.account.defaultWalletId')"
  [[ "$wallet_id" == "1232" ]] || exit 1
}
