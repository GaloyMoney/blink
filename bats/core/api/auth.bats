#!/usr/bin/env bats

load "../../helpers/_common.bash"
load "../../helpers/user.bash"

KRATOS_ADMIN_API="http://localhost:4434"

@test "auth: create user" {
  create_user 'charlie'

  exec_graphql 'charlie' 'identity'
  [[ "$(graphql_output '.data.me.phone')" = "$(read_value charlie.phone)" ]] || exit 1
}

@test "auth: logout user" {
  create_user 'charlie'
  exec_graphql 'charlie' 'identity'
  id="$(graphql_output '.data.me.id')"

  sessions_before_logout=$(curl -s $KRATOS_ADMIN_API/admin/identities/$id/sessions | jq '[.[] | select(.active == true)] | length')
  [[ "$sessions_before_logout" -eq 1 ]] || exit 1

  exec_graphql 'charlie' 'logout'
  [[ "$(graphql_output '.data.userLogout.success')" = "true" ]] || exit 1

  sessions_after_logout=$(curl -s $KRATOS_ADMIN_API/admin/identities/$id/sessions | jq '[.[] | select(.active == true)] | length')
  [[ "$sessions_after_logout" -eq 0 ]] || exit 1
}
