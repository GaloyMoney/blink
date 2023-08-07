#!/bin/bash

set -e

COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-quickstart}"
GALOY_ENDPOINT=${GALOY_ENDPOINT:-localhost:4002}

bitcoin_cli() {
  docker exec "${COMPOSE_PROJECT_NAME}-bitcoind-1" bitcoin-cli $@
}

lnd_cli() {
  docker exec "${COMPOSE_PROJECT_NAME}-lnd1-1" \
    lncli \
      --macaroonpath /root/.lnd/admin.macaroon \
      --tlscertpath /root/.lnd/tls.cert \
      $@
}

bria_cli() {
  docker exec "${COMPOSE_PROJECT_NAME}-bria-1" bria $@
}

bitcoin_signer_cli() {
  docker exec "${COMPOSE_PROJECT_NAME}-bitcoind-signer-1" bitcoin-cli $@
}

bitcoind_init() {
  bitcoin_cli createwallet "outside" || true
  bitcoin_cli -generate 200 > /dev/null 2>&1

  bitcoin_signer_cli createwallet "dev" || true
  bitcoin_signer_cli -rpcwallet=dev importdescriptors "$(cat ./galoy/test/bats/bitcoind_signer_descriptors.json)"
}

gql_file() {
  echo "galoy/test/bats/gql/$1.gql"
}

gql_query() {
  cat "$(gql_file $1)" | tr '\n' ' ' | sed 's/"/\\"/g'
}

exec_graphql() {
  set -x
  local token_name=$1
  local query_name=$2
  local variables=${3:-"{}"}

  if [[ ${token_name} == "anon" ]]; then
    AUTH_HEADER=""
  else
    AUTH_HEADER="Authorization: Bearer $(read_value ${token_name})"
  fi

  gql_route="graphql"

  curl -s \
    -X POST \
    ${AUTH_HEADER:+ -H "$AUTH_HEADER"} \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"$(gql_query $query_name)\", \"variables\": $variables}" \
    "${GALOY_ENDPOINT}/${gql_route}"
}

show_galoy() {
cat << "EOF"
                 ('-.                                        
                ( OO ).-.                                    
    ,----.      / . --. / ,--.      .-'),-----.   ,--.   ,--.
   '  .-./-')   | \-.  \  |  |.-') ( OO'  .-.  '   \  `.'  / 
   |  |_( O- ).-'-'  |  | |  | OO )/   |  | |  | .-')     /  
   |  | .--, \ \| |_.'  | |  |`-' |\_) |  |\|  |(OO  \   /   
  (|  | '. (_/  |  .-.  |(|  '---.'  \ |  | |  | |   /  /\_  
   |  '--'  |   |  | |  | |      |    `'  '-'  ' `-./  /.__) 
    `------'    `--' `--' `------'      `-----'    `--'      
EOF
}

main() {
  clear
  show_galoy
  echo
  echo "----------------"
  echo "----------------"
  echo
  echo "Checking that all services are up and running"
  echo
  echo "Seeding some regtest blocks..."
  bitcoind_init > /dev/null 2>&1
  echo "DONE"
  echo "Getting balance from bria..."
  bria_cli wallet-balance -w dev > /dev/null 2>&1
  echo "DONE"
  echo "Running getinfo on lnd..."
  lnd_cli getinfo > /dev/null 2>&1
  echo "DONE"
  echo
  echo "----------------"
  echo "----------------"
  echo
  echo "Hitting graphql endpoints"

  exec_graphql "anon" "globals"

  echo "DONE"
}

main
