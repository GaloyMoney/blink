#!/usr/bin/env bats

load "../../helpers/_common.bash"
load "../../helpers/user.bash"

setup_file() {
  clear_cache

  create_user 'alice'
}

@test "notifications: disable/enable notification channel" {
    token_name='alice' 

    variables=$( 
    jq -n \
      '{input: { channel: "PUSH" }}')

    exec_graphql "$token_name" 'account-disable-notification-channel-alt' "$variables"
    channel_enabled="$(graphql_output '.data.accountDisableNotificationChannelAlt.notificationSettings.push.enabled')"
  [[ "$channel_enabled" == "false" ]] || exit 1
}
