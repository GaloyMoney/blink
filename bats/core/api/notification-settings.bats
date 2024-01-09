#!/usr/bin/env bats

load "../../helpers/_common.bash"
load "../../helpers/user.bash"


setup_file() {
  clear_cache

  create_user 'alice'
}


@test "notification-settings: disable/enable notification channel" {
  token_name='alice' 

  variables=$( 
      jq -n \
      '{input: { channel: "PUSH" }}')

  exec_graphql "$token_name" 'account-disable-notification-channel' "$variables"
  channel_enabled="$(graphql_output '.data.accountDisableNotificationChannel.account.notificationSettings.push.enabled')"
  [[ "$channel_enabled" == "false" ]] || exit 1

  exec_graphql "$token_name" 'account-enable-notification-channel' "$variables"

  channel_enabled="$(graphql_output '.data.accountEnableNotificationChannel.account.notificationSettings.push.enabled')"
  [[ "$channel_enabled" == "true" ]] || exit 1
}

@test "notification-settings: disable/enable notification category" {
  token_name='alice' 

  variables=$( 
      jq -n \
      '{input: { channel: "PUSH", category: "Circles" }}')

  exec_graphql "$token_name" 'account-disable-notification-category' "$variables"
  disabled_category="$(graphql_output '.data.accountDisableNotificationCategory.account.notificationSettings.push.disabledCategories[0]')"
  [[ "$disabled_category" == "Circles" ]] || exit 1

  exec_graphql "$token_name" 'account-enable-notification-category' "$variables"

  disabled_length="$(graphql_output '.data.accountEnableNotificationCategory.account.notificationSettings.push.disabledCategories | length')"
  [[ "$disabled_length" == "0" ]] || exit 1
}
