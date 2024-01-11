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

    exec_graphql "$token_name" 'account-enable-notification-channel-alt' "$variables"
    channel_enabled="$(graphql_output '.data.accountEnableNotificationChannelAlt.notificationSettings.push.enabled')"
  [[ "$channel_enabled" == "true" ]] || exit 1
}

@test "notifications: disable/enable notification category" {
    token_name='alice' 

    variables=$( 
    jq -n \
      '{input: { channel: "PUSH", category: "CIRCLES" }}')

    exec_graphql "$token_name" 'account-disable-notification-category-alt' "$variables"
    disabled_category="$(graphql_output '.data.accountDisableNotificationCategoryAlt.notificationSettings.push.disabledCategories[0]')"

  [[ "$disabled_category" == "CIRCLES" ]] || exit 1

    exec_graphql "$token_name" 'account-enable-notification-category-alt' "$variables"
    disabled_length="$(graphql_output '.data.accountEnableNotificationCategoryAlt.notificationSettings.push.disabledCategories | length')"
  [[ "$disabled_length" == "0" ]] || exit 1
}
