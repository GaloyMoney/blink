#!/usr/bin/env bats

load "helpers/setup-and-teardown"
load "helpers/ln"

ANCHOR_FEE=330

setup_file() {
  clear_cache

  bitcoind_init
  start_trigger
  start_server

  lnds_init
}

teardown_file() {
  stop_trigger
  stop_server
}

setup() {
  lnd_cli closeallchannels || true
  bitcoin_cli -generate 10

  bitcoind_address=$(bitcoin_cli getnewaddress)
  lnd_cli sendcoins --addr=${bitcoind_address} --sweepall
  bitcoin_cli -generate 10
}

no_pending_lnd1_channels() {
  pending_channel="$(lnd_cli pendingchannels | jq -r '.pending_open_channels[0]')"
  if [[ "$pending_channel" != "null" ]]; then
    bitcoin_cli -generate 6
    exit 1
  fi
}

get_lnd1_balance() {
  offchain_balance="$(lnd_cli channelbalance | jq -r '.balance')"
  onchain_balance="$(lnd_cli walletbalance | jq -r '.confirmed_balance')"
  echo $(( $offchain_balance + $onchain_balance ))
}

get_lnd2_balance() {
  offchain_balance="$(lnd2_cli channelbalance | jq -r '.balance')"
  onchain_balance="$(lnd2_cli walletbalance | jq -r '.confirmed_balance')"
  echo $(( $offchain_balance + $onchain_balance ))
}

open_new_lnd1_lnd2_channel() {
  # 1. Fund lnd1
  lnd1_address="$(lnd_cli newaddress p2wkh | jq -r '.address')"
  bitcoin_cli sendtoaddress "$lnd1_address" "1"
  bitcoin_cli -generate 6

  # 2. Get lnd1 & lnd2 balance after
  lnd1_balance_before="$(get_lnd1_balance)"
  lnd2_balance_before="$(get_lnd2_balance)"
  balance_before="$(( $lnd1_balance_before + $lnd2_balance_before ))"

  # 3. Open lnd1 -> lnd2
  local_amount="500000"
  lnd2_local_pubkey="$(lnd2_cli getinfo | jq -r '.identity_pubkey')"
  lnd_cli connect "${lnd2_local_pubkey}@${COMPOSE_PROJECT_NAME}-lnd2-1:9735" || true
  opened=$(
    lnd_cli openchannel \
      --node_key "$lnd2_local_pubkey" \
      --local_amt "$local_amount"
  )
  funding_txid="$(echo $opened | jq -r '.funding_txid')"

  retry 10 1 mempool_not_empty
  retry 10 1 no_pending_lnd1_channels

  # 4. Get channel open fee
  opening_fee=$(
    lnd_cli listchaintxns \
      | jq -r \
        --arg channel_point "$funding_txid" \
        '.transactions[] | select(.tx_hash == $channel_point) | .total_fees'
  )

  # 5. Get lnd1 & lnd2 balance after
  lnd1_balance_after="$(get_lnd1_balance)"
  lnd2_balance_after="$(get_lnd2_balance)"
  balance_after="$(( $lnd1_balance_after + $lnd2_balance_after ))"

  escrow_discrepancy="$(( $balance_before - ($balance_after + $opening_fee) ))"
}

@test "ln-channel-escrow: new channel, local balance only" {
  # 1a. Open channel
  open_new_lnd1_lnd2_channel

  # 1b. Get channel
  channel="$(lnd_cli listchannels \
    | jq -r \
      --arg channel_point "$funding_txid" \
      '.channels[] | select(.channel_point | test($channel_point))')"

  # 2. Construct escrow from commit fee and assert
  lnd1_commit_fee="$(echo $channel | jq -r '.commit_fee')"

  escrow_from_commit_fee=$(( $lnd1_commit_fee + $ANCHOR_FEE ))
  [[ "$escrow_from_commit_fee" == "$escrow_discrepancy" ]] || exit 1

  # 3. Construct escrow from capacity and assert
  capacity="$(echo $channel | jq -r '.capacity')"
  local_balance="$(echo $channel | jq -r '.local_balance')"
  remote_balance="$(echo $channel | jq -r '.remote_balance')"

  escrow_from_capacity="$(( $capacity - ($local_balance + $remote_balance) ))"
  [[ "$escrow_from_capacity" == "$escrow_discrepancy" ]] || exit 1
}

@test "ln-channel-escrow: new channel, local & remote balance" {
  # 1a. Open channel
  open_new_lnd1_lnd2_channel

  # 1b. Create remote balance
  invoice_response="$(lnd2_cli addinvoice)"
  payment_request="$(echo $invoice_response | jq -r '.payment_request')"
  lnd_cli payinvoice -f \
    --pay_req "$payment_request" \
    --amt "10000"

  # 1c. Get channel
  channel="$(lnd_cli listchannels \
    | jq -r \
      --arg channel_point "$funding_txid" \
      '.channels[] | select(.channel_point | test($channel_point))')"

  # 2. Construct escrow from commit fee and assert
  # commit_fee will drop and an additional anchor fee is added
  lnd1_commit_fee="$(echo $channel | jq -r '.commit_fee')"

  # no longer equal from changed commit_fee
  escrow_from_commit_fee=$(( $lnd1_commit_fee + $ANCHOR_FEE ))
  [[ "$escrow_from_commit_fee" != "$escrow_discrepancy" ]] || exit 1

  # 3. Construct escrow from capacity and assert
  capacity="$(echo $channel | jq -r '.capacity')"
  local_balance="$(echo $channel | jq -r '.local_balance')"
  remote_balance="$(echo $channel | jq -r '.remote_balance')"

  escrow_from_capacity="$(( $capacity - ($local_balance + $remote_balance) ))"
  [[ "$escrow_from_capacity" == "$escrow_discrepancy" ]] || exit 1
}

@test "ln-channel-escrow: new channel, local & pending htlc" {
  # 1a. Open channel
  open_new_lnd1_lnd2_channel

  # 1b. Create pending remote balance
  secret=$(xxd -l 32 -p /dev/urandom)
  payment_hash=$(echo -n $secret | xxd -r -p | sha256sum | cut -d ' ' -f1)
  invoice_response="$(lnd2_cli addholdinvoice $payment_hash)"
  payment_request="$(echo $invoice_response | jq -r '.payment_request')"
  lnd_cli payinvoice -f \
    --pay_req "$payment_request" \
    --amt "10000" &
  sleep 3

  # 1c. Get channel
  channel="$(lnd_cli listchannels \
    | jq -r \
      --arg channel_point "$funding_txid" \
      '.channels[] | select(.channel_point | test($channel_point))')"

  lnd2_cli cancelinvoice $payment_hash

  # 2. Construct escrow from commit fee and assert
  # commit_fee will increase
  lnd1_commit_fee="$(echo $channel | jq -r '.commit_fee')"
  echo $lnd1_commit_fee >> output.txt

  # no longer equal from changed commit_fee
  escrow_from_commit_fee=$(( $lnd1_commit_fee + $ANCHOR_FEE ))
  echo $escrow_from_commit_fee >> output.txt
  [[ "$escrow_from_commit_fee" != "$escrow_discrepancy" ]] || exit 1

  # 3. Construct escrow from capacity and assert
  capacity="$(echo $channel | jq -r '.capacity')"
  local_balance="$(echo $channel | jq -r '.local_balance')"
  remote_balance="$(echo $channel | jq -r '.remote_balance')"

  # no longer equal from changed local_balance
  escrow_from_capacity="$(( $capacity - ($local_balance + $remote_balance) ))"
  [[ "$escrow_from_capacity" != "$escrow_discrepancy" ]] || exit 1
}
