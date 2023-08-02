#!/usr/bin/env bats

load "helpers/setup-and-teardown"
load "helpers/ln"

setup_file() {
  clear_cache

  bitcoind_init
  start_trigger
  start_server
  start_exporter

  lnds_init
}

teardown_file() {
  stop_trigger
  stop_server
  stop_exporter
}

@test "cron: rebalance hot to cold storage" {
  address=$(bria_cli new-address -w dev | jq -r '.address')

  bitcoin_cli sendtoaddress "$address" "100"
  bitcoin_cli -generate 2

  local key1="tpubDEaDfeS1EXpqLVASNCW7qAHW1TFPBpk2Z39gUXjFnsfctomZ7N8iDpy6RuGwqdXAAZ5sr5kQZrxyuEn15tqPJjM4mcPSuXzV27AWRD3p9Q4"
  local key2="tpubDEPCxBfMFRNdfJaUeoTmepLJ6ZQmeTiU1Sko2sdx1R3tmPpZemRUjdAHqtmLfaVrBg1NBx2Yx3cVrsZ2FTyBuhiH9mPSL5ozkaTh1iZUTZx"
  
  bria_cli import-xpub -x "${key1}" -n cold-key1 -d m/48h/1h/0h/2h || true 
  bria_cli import-xpub -x "${key2}" -n cold-key2 -d m/48h/1h/0h/2h || true 
  bria_cli create-wallet -n cold sorted-multisig -x cold-key1 cold-key2 -t 1 || true 

  cold_balance=$(bria_cli wallet-balance -w cold | jq -r '.effectivePendingIncome')

  [[ "${cold_balance}" = "0" ]] || exit 1

  run_cron

  for i in {1..20}; do
    cold_balance=$(bria_cli wallet-balance -w cold | jq -r '.effectivePendingIncome')
    [[ "${cold_balance}" != "0" ]] || break;
    sleep 1
  done
  cold_balance=$(bria_cli wallet-balance -w cold | jq -r '.effectivePendingIncome')
  bitcoin_cli -generate 2
}
