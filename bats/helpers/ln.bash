CURRENT_FILE=${BASH_SOURCE:-bats/helpers/.}
source "$(dirname "$CURRENT_FILE")/_common.bash"
source "$(dirname "$CURRENT_FILE")/cli.bash"

create_new_lnd_onchain_address() {
  local wallet_name=$1
  local wallet_id=$(read_value $wallet_name)

  insert_lnd1_address() {
    local wallet_id=$1
    local address=$2
    pubkey=$(lnd_cli getinfo | jq -r '.identity_pubkey')

    mongo_command=$(echo "db.wallets.updateOne(
      { id: \"$wallet_id\" },
      {
        \$push: {
          onchain: {
            address: \"$address\",
            pubkey: \"$pubkey\"
          }
        }
      }
    );" | tr -d '[:space:]')

    mongo_cli "$mongo_command"
  }

  address=$(lnd_cli newaddress p2wkh | jq -r '.address')
  insert_lnd1_address "$wallet_id" "$address" > /dev/null

  echo $address
}