#!/usr/bin/env bats

load "../../helpers/_common.bash"
load "../../helpers/user.bash"
load "../../helpers/onchain.bash"

setup_file() {
  clear_cache

  create_user 'alice'
}

@test "notifications: list stateful transactions" {
  btc_wallet_name="alice.btc_wallet_id"
  amount="0.01"

  # Create address and broadcast transaction 1
  variables=$(
    jq -n \
    --arg wallet_id "$(read_value $btc_wallet_name)" \
    '{input: {walletId: $wallet_id}}'
  )

  exec_graphql 'alice' 'on-chain-address-create' "$variables"
  on_chain_address_created_1="$(graphql_output '.data.onChainAddressCreate.address')"
  [[ "${on_chain_address_created_1}" != "null" ]] || exit 1

  bitcoin_cli sendtoaddress "$on_chain_address_created_1" "$amount"
  retry 15 1 check_for_incoming_broadcast 'alice' "$on_chain_address_created_1"

  exec_graphql 'alice' 'list-stateful-notifications'
  n_notifications=$(graphql_output '.data.me.statefulNotifications.nodes | length')
  [[ $n_notifications -eq 1 ]] || exit 1

  bitcoin_cli -generate 2
  retry 30 1 check_for_onchain_initiated_settled 'alice' "$on_chain_address_created_1" 2

  exec_graphql 'alice' 'list-stateful-notifications'
  n_notifications=$(graphql_output '.data.me.statefulNotifications.nodes | length')
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

@test "notifications: load test" {
  for in $(seq 1 100); do
    # create 100000 users
    # And update their language to spanish
  done

  # execute a trivial marketing notification
}
