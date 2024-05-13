#!/usr/bin/env bats

load "../../helpers/_common.bash"
load "../../helpers/user.bash"
load "../../helpers/admin.bash"

setup_file() {
  clear_cache

  create_user 'alice'

  login_admin
}

@test "notifications: list stateful notifications" {
  admin_token="$(read_value 'admin.token')"

  variables=$(
    jq -n \
    '{
      input: {
        localizedNotificationContents: [
          {
            language: "en",
            title: "Test title",
            body: "test body"
          }
        ],
        shouldSendPush: false,
        shouldAddToHistory: true,
        shouldAddToBulletin: true,
      }
    }'
  )

  # trigger a marketing notification
  exec_admin_graphql "$admin_token" 'marketing-notification-trigger' "$variables"

  local n_notifications
  for i in {1..10}; do
    exec_graphql 'alice' 'list-stateful-notifications'
    n_notifications=$(graphql_output '.data.me.statefulNotifications.nodes | length')
    [[ $n_notifications -eq 1 ]] && break;
    sleep 1
  done
  [[ $n_notifications -eq 1 ]] || exit 1;

  exec_admin_graphql "$admin_token" 'marketing-notification-trigger' "$variables"

  for i in {1..10}; do
    exec_graphql 'alice' 'list-stateful-notifications'
    n_notifications=$(graphql_output '.data.me.statefulNotifications.nodes | length')
    [[ $n_notifications -eq 2 ]] && break;
      sleep 1
  done
  [[ $n_notifications -eq 2 ]] || exit 1;
}

@test "notifications: list stateful notifications paginated with cursor" {
  exec_graphql 'alice' 'list-stateful-notifications' '{"first": 1}'
  n_notifications=$(graphql_output '.data.me.statefulNotifications.nodes | length')
  first_id=$(graphql_output '.data.me.statefulNotifications.nodes[0].id')
  cursor=$(graphql_output '.data.me.statefulNotifications.pageInfo.endCursor')
  next_page=$(graphql_output '.data.me.statefulNotifications.pageInfo.hasNextPage')
  [[ $n_notifications -eq 1 ]] || exit 1
  [[ "$next_page" = "true" ]] || exit 1

  variables=$(
    jq -n \
    --arg after "${cursor}" \
    '{first: 1, after: $after}'
  )
  exec_graphql 'alice' 'list-stateful-notifications' "$variables"
  n_notifications=$(graphql_output '.data.me.statefulNotifications.nodes | length')
  second_id=$(graphql_output '.data.me.statefulNotifications.nodes[0].id')
  next_page=$(graphql_output '.data.me.statefulNotifications.pageInfo.hasNextPage')
  [[ $n_notifications -eq 1 ]] || exit 1
  [[ "${first_id}" != "${second_id}" ]] || exit 1
  [[ "$next_page" = "false" ]] || exit 1
}

@test "notifications: acknowledge stateful notification" {
  exec_graphql 'alice' 'list-stateful-notifications' '{"first": 1}'
  n_notifications=$(graphql_output '.data.me.statefulNotifications.nodes | length')
  id=$(graphql_output '.data.me.statefulNotifications.nodes[0].id')
  acknowledged_at=$(graphql_output '.data.me.statefulNotifications.nodes[0].acknowledgedAt')
  [[ "$acknowledged_at" = "null" ]] || exit 1

  variables=$(
    jq -n \
    --arg id "${id}" \
    '{input: {notificationId: $id}}'
  )
  exec_graphql 'alice' 'acknowledge-notification' "$variables"
  acknowledged_at=$(graphql_output '.data.statefulNotificationAcknowledge.notification.acknowledgedAt')
  [[ "$acknowledged_at" != "null" ]] || exit 1
}

@test "notifications: unacknowledged stateful notifications count" {
  exec_graphql 'alice' 'unacknowledged-stateful-notifications-without-bulletin-enabled-count'
  count=$(graphql_output '.data.me.unacknowledgedStatefulNotificationsWithoutBulletinEnabledCount')
  [[ $count -eq 1 ]] || exit 1

  exec_graphql 'alice' 'list-stateful-notifications' '{"first": 2}'
  n_notifications=$(graphql_output '.data.me.statefulNotifications.nodes | length')
  id=$(graphql_output '.data.me.statefulNotifications.nodes[1].id')
  acknowledged_at=$(graphql_output '.data.me.statefulNotifications.nodes[1].acknowledgedAt')
  [[ "$acknowledged_at" = "null" ]] || exit 1
  variables=$(
    jq -n \
    --arg id "${id}" \
    '{input: {notificationId: $id}}'
  )
  exec_graphql 'alice' 'acknowledge-notification' "$variables"

  exec_graphql 'alice' 'unacknowledged-stateful-notifications-without-bulletin-enabled-count'
  count=$(graphql_output '.data.me.unacknowledgedStatefulNotificationsWithoutBulletinEnabledCount')
  [[ $count -eq 0 ]] || exit 1

}

@test "notifications: list unacknowledged stateful notifications with bulletin enabled" {
  local n_notifications
  exec_graphql 'alice' 'list-unacknowledged-stateful-notifications-with-bulletin-enabled'
  n_notifications=$(graphql_output '.data.me.unacknowledgedStatefulNotificationsWithBulletinEnabled.nodes | length')
  [[ $n_bulletins -eq 0 ]] || exit 1

  admin_token="$(read_value 'admin.token')"

  variables=$(
    jq -n \
    '{
      input: {
        localizedNotificationContents: [
          {
            language: "en",
            title: "Test title",
            body: "test body"
          }
        ],
        shouldSendPush: false,
        shouldAddToHistory: true,
        shouldAddToBulletin: true,
      }
    }'
  )

  # trigger two marketing notification
  exec_admin_graphql "$admin_token" 'marketing-notification-trigger' "$variables"
  exec_admin_graphql "$admin_token" 'marketing-notification-trigger' "$variables"

  for i in {1..10}; do
    exec_graphql 'alice' 'list-unacknowledged-stateful-notifications-with-bulletin-enabled'
    n_notifications=$(graphql_output '.data.me.unacknowledgedStatefulNotificationsWithBulletinEnabled.nodes | length')
    [[ $n_notifications -eq 2 ]] && break;
    sleep 1
  done
  [[ $n_notifications -eq 2 ]] || exit 1;
}

@test "notifications: list unacknowledged stateful notifications with bulletin enabled paginated with cursor" {
  exec_graphql 'alice' 'list-unacknowledged-stateful-notifications-with-bulletin-enabled' '{"first": 1}'
  n_notifications=$(graphql_output '.data.me.unacknowledgedStatefulNotificationsWithBulletinEnabled.nodes | length')
  first_id=$(graphql_output '.data.me.unacknowledgedStatefulNotificationsWithBulletinEnabled.nodes[0].id')
  cursor=$(graphql_output '.data.me.unacknowledgedStatefulNotificationsWithBulletinEnabled.pageInfo.endCursor')
  next_page=$(graphql_output '.data.me.unacknowledgedStatefulNotificationsWithBulletinEnabled.pageInfo.hasNextPage')
  [[ $n_notifications -eq 1 ]] || exit 1
  [[ "$next_page" = "true" ]] || exit 1

  variables=$(
    jq -n \
    --arg after "${cursor}" \
    '{first: 1, after: $after}'
  )
  exec_graphql 'alice' 'list-unacknowledged-stateful-notifications-with-bulletin-enabled' "$variables"
  n_notifications=$(graphql_output '.data.me.unacknowledgedStatefulNotificationsWithBulletinEnabled.nodes | length')
  second_id=$(graphql_output '.data.me.unacknowledgedStatefulNotificationsWithBulletinEnabled.nodes[0].id')
  next_page=$(graphql_output '.data.me.unacknowledgedStatefulNotificationsWithBulletinEnabled.pageInfo.hasNextPage')
  [[ $n_notifications -eq 1 ]] || exit 1
  [[ "${first_id}" != "${second_id}" ]] || exit 1
  [[ "$next_page" = "false" ]] || exit 1
}

@test "notifications: list stateful notifications without bulletin enabled" {
  local n_notifications
  exec_graphql 'alice' 'list-stateful-notifications-without-bulletin-enabled'
  n_notifications=$(graphql_output '.data.me.listStatefulNotificationsWithoutBulletinEnabled.nodes | length')
  [[ $n_bulletins -eq 0 ]] || exit 1

  admin_token="$(read_value 'admin.token')"

  variables=$(
    jq -n \
    '{
      input: {
        localizedNotificationContents: [
          {
            language: "en",
            title: "Test title",
            body: "test body"
          }
        ],
        shouldSendPush: false,
        shouldAddToHistory: true,
        shouldAddToBulletin: false,
      }
    }'
  )

  # trigger two marketing notification
  exec_admin_graphql "$admin_token" 'marketing-notification-trigger' "$variables"
  exec_admin_graphql "$admin_token" 'marketing-notification-trigger' "$variables"

  for i in {1..10}; do
    exec_graphql 'alice' 'list-stateful-notifications-without-bulletin-enabled'
    n_notifications=$(graphql_output '.data.me.listStatefulNotificationsWithoutBulletinEnabled.nodes | length')
    [[ $n_notifications -eq 2 ]] && break;
    sleep 1
  done
  [[ $n_notifications -eq 2 ]] || exit 1;
}

@test "notifications: list stateful notifications without bulletin enabled paginated with cursor" {
  exec_graphql 'alice' 'list-stateful-notifications-without-bulletin-enabled' '{"first": 1}'
  n_notifications=$(graphql_output '.data.me.listStatefulNotificationsWithoutBulletinEnabled.nodes | length')
  first_id=$(graphql_output '.data.me.listStatefulNotificationsWithoutBulletinEnabled.nodes[0].id')
  cursor=$(graphql_output '.data.me.listStatefulNotificationsWithoutBulletinEnabled.pageInfo.endCursor')
  next_page=$(graphql_output '.data.me.listStatefulNotificationsWithoutBulletinEnabled.pageInfo.hasNextPage')
  [[ $n_notifications -eq 1 ]] || exit 1
  [[ "$next_page" = "true" ]] || exit 1

  variables=$(
    jq -n \
    --arg after "${cursor}" \
    '{first: 1, after: $after}'
  )
  exec_graphql 'alice' 'list-stateful-notifications-without-bulletin-enabled' "$variables"
  n_notifications=$(graphql_output '.data.me.listStatefulNotificationsWithoutBulletinEnabled.nodes | length')
  second_id=$(graphql_output '.data.me.listStatefulNotificationsWithoutBulletinEnabled.nodes[0].id')
  next_page=$(graphql_output '.data.me.listStatefulNotificationsWithoutBulletinEnabled.pageInfo.hasNextPage')
  [[ $n_notifications -eq 1 ]] || exit 1
  [[ "${first_id}" != "${second_id}" ]] || exit 1
  [[ "$next_page" = "false" ]] || exit 1
}
