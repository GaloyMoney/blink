#!/usr/bin/env bats

load "../../helpers/_common.bash"
load "../../helpers/user.bash"
load "../../helpers/admin.bash"

setup_file() {
  clear_cache

  create_user 'merchant'
  user_update_username 'merchant'

  login_admin
}

@test "merchant: add a merchant with admin api" {
  admin_token="$(read_value 'admin.token')"
  latitude=40.712776
  longitude=-74.005974
  title="My Merchant"
  local username="$(read_value merchant.username)"

  variables=$(jq -n \
    --arg latitude "$latitude" \
    --arg longitude "$longitude" \
    --arg title "$title" \
    --arg username "$username" \
    '{input: {latitude: ($latitude | tonumber), longitude: ($longitude | tonumber), title: $title, username: $username}}'
  )

  exec_admin_graphql $admin_token 'business-update-map-info' "$variables"
  latitude_result="$(graphql_output '.data.businessUpdateMapInfo.merchant.coordinates.latitude')"
  [[ "$latitude_result" == "$latitude" ]] || exit 1
}

@test "merchant: can query merchants" {
  local username="$(read_value merchant.username)"
  exec_graphql 'anon' 'business-map-markers'
  fetch_username="$(graphql_output '.data.businessMapMarkers[0].username')"
  [[ $username = $fetch_username ]] || exit 1
}

@test "merchant: delete merchant with admin api" {
  admin_token="$(read_value 'admin.token')"
  local username="$(read_value merchant.username)"

  variables=$(jq -n \
    --arg username "$username" \
    '{input: {username: $username}}'
  )

  exec_admin_graphql $admin_token 'business-delete-map-info' "$variables"

  exec_graphql 'anon' 'business-map-markers'
  map_markers="$(graphql_output)"
  markers_length=$(echo "$map_markers" | jq '.data.businessMapMarkers | length')

  [[ $markers_length -eq 0 ]] || exit 1
}
