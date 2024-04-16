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
    exec_graphql "$token_name" 'user-in-app-notification-mark-as-read' "$variables"
    read_at="$(graphql_output '.data.userInAppNotificationMarkAsRead.notification.readAt')"

    # ensure that read at is not null
    [[ "$read_at" != "null" ]] || exit 1

}
