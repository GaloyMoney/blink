CURRENT_FILE=${BASH_SOURCE:-bats/helpers/.}
source "$(dirname "$CURRENT_FILE")/_common.bash"
source "$(dirname "$CURRENT_FILE")/cli.bash"

cache_funder_wallet_id() {
  role="funder"
  mongo_command=$(echo "db.accounts.findOne(
      { role: '$role' },
      { defaultWalletId: 1, _id: 0 }
    ).defaultWalletId;" | tr -d '[:space:]')

  wallet_id=$(mongo_cli "$mongo_command")
  cache_value "$role.btc_wallet_id" "$wallet_id"
}
