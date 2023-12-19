#!/bin/bash

# Import deps
COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-quickstart}"

DEV_DIR="$(dirname "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")")"
source "${DEV_DIR}/bin/_retry.sh"
source "${DEV_DIR}/helpers/cli.sh"

# Setup helper functions
mempool_not_empty() {
  echo "Waiting for txn to show up in mempool..."
  local txid="$(bitcoin_cli getrawmempool | jq -r ".[0]")"
  if [[ "$txid" == "null" ]]; then
    return 1
  else
    echo "Found txid: ${txid}"
  fi
}

no_pending_channels() {
  pending_channel="$(lnd_outside_cli pendingchannels | jq -r '.pending_open_channels[0].channel.channel_point')"
  if [[ "$pending_channel" != "null" ]]; then
    echo "Mining 3 blocks for channel: ${pending_channel}"
    bitcoin_cli -generate 3 > /dev/null 2>&1
    return 1
  fi
}

synced_to_graph() {
  is_synced="$(lnd_outside_cli getinfo | jq -r '.synced_to_graph')"
  [[ "$is_synced" == "true" ]] || return 1
}

# Fund lndOutside1
block_rewards=3
echo "Funding 'outside' bitcoind wallet..."
bitcoin_cli createwallet "outside" > /dev/null 2>&1 || true
bitcoin_cli -generate "${block_rewards}" > /dev/null 2>&1
echo "Funded with "${block_rewards}" block rewards"

echo "Funding 'lndOutside1' node..."
amount="1"
address="$(lnd_outside_cli newaddress p2wkh | jq -r '.address')"
local_amount="10000000"
push_amount="5000000"
funded_txid=$(bitcoin_cli sendtoaddress "$address" "$amount")
bitcoin_cli -generate 3 > /dev/null 2>&1
echo "Funded with txid: ${funded_txid}"

# Open channel from lndoutside1 -> lnd1
echo "Opening channel: lndoutside1 -> lnd1..."
pubkey_lnd1="$(lnd_cli getinfo | jq -r '.identity_pubkey')"
endpoint_lnd1="${COMPOSE_PROJECT_NAME}-lnd1-1:9735"
lnd_outside_cli connect "${pubkey_lnd1}@${endpoint_lnd1}" > /dev/null 2>&1 || true
retry 10 1 synced_to_graph
funding_txid=$(lnd_outside_cli openchannel \
  --node_key "$pubkey_lnd1" \
  --local_amt "$local_amount" \
  | jq -r '.funding_txid'
)
if [[ -z "${funding_txid}" ]]; then
  echo "Failed to open channel"
  exit 1
fi
echo "Channel opened with txid: ${funding_txid}"

retry 10 1 mempool_not_empty
retry 10 1 no_pending_channels
echo "Channel ${funding_txid} confirmed"

# Open channel with push from lndoutside1 -> lndoutside2
echo "Opening balanced channel: lndoutside1 -> lndoutside2..."
pubkey_lnd_outside_2="$(lnd_outside_2_cli getinfo | jq -r '.identity_pubkey')"
endpoint_lnd_outside_2="${COMPOSE_PROJECT_NAME}-lnd-outside-2-1:9735"
lnd_outside_cli connect "${pubkey_lnd_outside_2}@${endpoint_lnd_outside_2}" > /dev/null 2>&1 || true
retry 10 1 synced_to_graph
funding_txid=$(lnd_outside_cli openchannel \
  --node_key "$pubkey_lnd_outside_2" \
  --local_amt "$local_amount" \
  --push_amt "$push_amount" \
  | jq -r '.funding_txid'
)
if [[ "${funding_txid}" == "null" ]]; then
  echo "Failed to open channel"
  exit 1
fi
echo "Channel opened with txid: ${funding_txid}"

retry 10 1 mempool_not_empty
retry 10 1 no_pending_channels
echo "Channel ${funding_txid} confirmed"

echo "DONE"
