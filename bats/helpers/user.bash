CURRENT_FILE=${BASH_SOURCE:-bats/helpers/.}
source "$(dirname "$CURRENT_FILE")/_common.bash"

login_user() {
  local token_name=$1
  local phone=$2

  local code="000000"

  local variables
  variables=$(
    jq -n \
    --arg phone "$phone" \
    --arg code "$code" \
    '{input: {phone: $phone, code: $code}}'
  )
  exec_graphql 'anon' 'user-login' "$variables"
  auth_token="$(graphql_output '.data.userLogin.authToken')"
  [[ -n "${auth_token}" && "${auth_token}" != "null" ]]
  cache_value "$token_name" "$auth_token"

  exec_graphql "$token_name" 'wallets-for-account'

  btc_wallet_id="$(graphql_output '.data.me.defaultAccount.wallets[] | select(.walletCurrency == "BTC") .id')"
  [[ "${btc_wallet_id}" != "null" ]]
  cache_value "$token_name.btc_wallet_id" "$btc_wallet_id"

  usd_wallet_id="$(graphql_output '.data.me.defaultAccount.wallets[] | select(.walletCurrency == "USD") .id')"
  [[ "${usd_wallet_id}" != "null" ]]
  cache_value "$token_name.usd_wallet_id" "$usd_wallet_id"
}

create_user() {
  local token_name=$1
  local phone=$(random_phone)

  login_user "$token_name" "$phone"
  cache_value "$token_name.phone" "$phone"
}

random_phone() {
  printf "+1%010d\n" $(( ($RANDOM * 1000000) + ($RANDOM % 1000000) ))
}

user_update_username() {
  local token_name="$1"

  # Check if username is already set an username present
  if $(read_value "$token_name.username" 2>/dev/null); then
    return
  fi

  local username="${token_name}_$RANDOM"

  local variables=$(
    jq -n \
    --arg username "$username" \
    '{input: {username: $username}}'
  )
  exec_graphql "$token_name" 'user-update-username' "$variables"
  num_errors="$(graphql_output '.data.userUpdateUsername.errors | length')"
  username="$(graphql_output '.data.userUpdateUsername.user.username')"
  [[ "$num_errors" == "0" || "$username" == "$token_name" ]] || exit 1

  cache_value "$token_name.username" "$username"
}

is_contact() {
  local token_name="$1"
  local contact_username="$(read_value "$2.username")"

  exec_graphql "$token_name" 'contacts'
  local fetched_username=$(
    graphql_output \
    --arg contact_username "$contact_username" \
    '.data.me.contacts[] | select(.username == $contact_username) .username'
  )
  [[ "$fetched_username" == "$contact_username" ]] || return 1
}
