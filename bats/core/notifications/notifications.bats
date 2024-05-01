#!/usr/bin/env bats

load "../../helpers/_common.bash"
load "../../helpers/user.bash"
load "../../helpers/admin.bash"

setup_file() {
  clear_cache

  create_user 'alice'

  login_admin
}

@test "notifications: list stateful transactions" {
  admin_token="$(read_value 'admin.token')"

  # trigger a marketing notification
  variables=$(
    jq -n \
    '{
      input: {
        localizedPushContents: [
          {
            language: "en",
            title: "Test title",
            body: "test body"
          }
        ],
        deepLink: "EARN"
      }
    }'
  )
  exec_admin_graphql "$admin_token" 'marketing-notification-trigger' "$variables"

  local n_notifications
  for i in {1..15}; do
    exec_graphql 'alice' 'list-stateful-notifications'
    n_notifications=$(graphql_output '.data.me.statefulNotifications.nodes | length')
    if [[ $n_notifications -eq 1 ]]; then
        break
    else
      sleep 1
    fi
  done
  [[ $n_notifications -eq 1 ]] || exit 1

  exec_admin_graphql "$admin_token" 'marketing-notification-trigger' "$variables"

  for i in {1..15}; do
    exec_graphql 'alice' 'list-stateful-notifications'
    n_notifications=$(graphql_output '.data.me.statefulNotifications.nodes | length')
    if [[ $n_notifications -eq 2 ]]; then
        break
    else
      sleep 1
    fi
  done
  [[ $n_notifications -eq 2 ]] || exit 1
}

@test "notifications: list stateful transactions paginated with cursor" {
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

@test "notifications: acknowledge stateful transactions" {
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

@test "notifications: unacknowledged_stateful_notifications_count" {
  exec_graphql 'alice' 'unacknowledged_stateful_notifications_count'
  count=$(graphql_output '.data.me.unacknowledgedStatefulNotificationsCount')
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

  exec_graphql 'alice' 'unacknowledged_stateful_notifications_count'
  count=$(graphql_output '.data.me.unacknowledgedStatefulNotificationsCount')
  [[ $count -eq 0 ]] || exit 1

}
