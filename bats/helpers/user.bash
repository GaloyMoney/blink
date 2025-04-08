CURRENT_FILE=${BASH_SOURCE:-bats/helpers/.}
source "$(dirname "$CURRENT_FILE")/_common.bash"
source "$(dirname "$CURRENT_FILE")/cli.bash"

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

create_user_with_metadata() {
  local token_name=$1
  create_user "$token_name"

  # Add phone metadata
  mongo_command=$(echo "db.users.updateOne(
        { phone: \"$(read_value $token_name.phone)\" },
        {
          \$set: {
            phoneMetadata: {
              carrier: { type: \"mobile\" },
              countryCode: \"SV\"
            }
          }
        }
      );" | tr -d '[:space:]')
  mongo_cli "$mongo_command"

  # Add IP metadata
  exec_graphql "$token_name" 'default-account'
  account_id=$(graphql_output '.data.me.defaultAccount.id')

  mongo_command=$(echo "db.accountips.insertOne(
        {
          ip: \"138.186.249.229\",
          accountId: \"$account_id\",
          metadata: {
            isoCode: \"SV\",
            asn: \"AS27773\"
          }
        }
      );" | tr -d '[:space:]')
  mongo_cli "$mongo_command"
}

random_phone() {
  local area_codes=(212 213 214 215 312 310 415 408 617 202 404 305 713 206 303 312 205 216 412 702 612 718 619 704 314 505 602 508 813 630 503 615 714 804 916 512 314 651 919 510)

  # Pick a random area code from the list
  local area_code=${area_codes[$RANDOM % ${#area_codes[@]}]}

  # Generate a random exchange - avoid invalid exchanges (e.g., those starting with 0 or 1)
  local exchange=$(( ($RANDOM % 8) + 2 ))$(( $RANDOM % 10 ))$(( $RANDOM % 10 ))

  # Generate a random subscriber number
  local subscriber=$(( $RANDOM % 10000 ))

  # Format as +1XXXXXXXXXX
  printf "+1%s%s%04d\n" "$area_code" "$exchange" "$subscriber"
}

user_update_username() {
  local token_name="$1"

  # Check if username is already set an username present
  if read_value "$token_name.username" >/dev/null 2>&1; then
    return
  fi

  local username="${2:-${token_name}_$RANDOM}"

  local variables=$(
    jq -n \
    --arg username "$username" \
    '{input: {username: $username}}'
  )
  exec_graphql "$token_name" 'user-update-username' "$variables"
  num_errors="$(graphql_output '.data.userUpdateUsername.errors | length')"
  [[ "$num_errors" == "0"  ]] || exit 1

  cache_value "$token_name.username" "$username"
}

ensure_username_is_present() {
  local variables=$(
    jq -n \
    --arg username "$1" \
    '{username: $username}'
  )
  exec_graphql 'anon' 'username-available' "$variables"
  username_available="$(graphql_output '.data.usernameAvailable')"

  if [[ "$username_available" == "true" ]]; then
    create_user "$1"
    user_update_username "$1" "$1"
  fi
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
