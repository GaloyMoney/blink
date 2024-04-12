#!/usr/bin/env bats

load "../../helpers/_common.bash"
load "../../helpers/user.bash"

setup_file() {
  clear_cache

  create_user 'alice'
}

NOTIFICATIONS_GRPC_ENDPOINT="localhost:6685"
IMPORT_PATH="${REPO_ROOT}/core/notifications/proto"
NOTIFICATIONS_PROTO_FILE="${REPO_ROOT}/core/notifications/proto/notifications.proto"

@test "notifications: disable/enable notification channel" {
    token_name='alice' 

    variables=$( 
    jq -n \
      '{input: { channel: "PUSH" }}')

    exec_graphql "$token_name" 'user-disable-notification-channel' "$variables"
    channel_enabled="$(graphql_output '.data.userDisableNotificationChannel.notificationSettings.push.enabled')"

  [[ "$channel_enabled" == "false" ]] || exit 1

    # Ensure notification settings exist on user
    exec_graphql "$token_name" 'user-notification-settings'
    user_channel_enabled="$(graphql_output '.data.me.notificationSettings.push.enabled')"

    [[ "$user_channel_enabled" == "false" ]] || exit 1


    exec_graphql "$token_name" 'user-enable-notification-channel' "$variables"
    channel_enabled="$(graphql_output '.data.userEnableNotificationChannel.notificationSettings.push.enabled')"
  [[ "$channel_enabled" == "true" ]] || exit 1
}

@test "notifications: disable/enable notification category" {
    token_name='alice' 

    variables=$( 
    jq -n \
      '{input: { channel: "PUSH", category: "CIRCLES" }}')

    exec_graphql "$token_name" 'user-disable-notification-category' "$variables"
    disabled_category="$(graphql_output '.data.userDisableNotificationCategory.notificationSettings.push.disabledCategories[0]')"

  [[ "$disabled_category" == "CIRCLES" ]] || exit 1

    exec_graphql "$token_name" 'user-enable-notification-category' "$variables"
    disabled_length="$(graphql_output '.data.userEnableNotificationCategory.notificationSettings.push.disabledCategories | length')"
  [[ "$disabled_length" == "0" ]] || exit 1
}

@test "notifications: mark in app notification as read" {
    token_name='alice'

    # get the user id
    exec_graphql "$token_name" 'identity'
    user_id="$(graphql_output '.data.me.id')"

    # create a notification event for the user id
    service_method="services.notifications.v1.NotificationsService/HandleNotificationEvent"

    request_data=$(jq -n --arg user_id "$user_id" '{
        "event": {
            "identityVerificationReviewStarted": {
                "userId": $user_id
            }
        }
    }')

    grpcurl_request $IMPORT_PATH $NOTIFICATIONS_PROTO_FILE $NOTIFICATIONS_GRPC_ENDPOINT "$service_method" "$request_data"

    # get the notification id
    exec_graphql "$token_name" 'user-in-app-notifications'
    notification_id="$(graphql_output '.data.me.inAppNotifications[0].id')"

    # ensure that read at is null
    read_at="$(graphql_output '.data.me.inAppNotifications[0].readAt')"
    [[ "$read_at" == "null" ]] || exit 1

    variables=$(
    jq -n \
      --arg notification_id "$notification_id" \
      '{input: { notificationId: $notification_id }}'
    )

    # mark the notification as read
    exec_graphql "$token_name" 'user-mark-in-app-notification-as-read' "$variables"
    read_at="$(graphql_output '.data.userMarkInAppNotificationAsRead.notification.readAt')"

    # ensure that read at is not null
    [[ "$read_at" != "null" ]] || exit 1

}
