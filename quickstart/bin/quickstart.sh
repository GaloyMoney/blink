#!/bin/bash

set -e

COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-quickstart}"

DIR="$(dirname "$(readlink -f "$BASH_SOURCE")")"
source ${DIR}/helpers.sh

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
  show_galoy
  echo "------------------------------------------------------------"
  echo "------------------------------------------------------------"
  echo
  echo "Checking that all services are up and running"
  echo
  ${DIR}/init-onchain.sh
  ${DIR}/init-lightning.sh
  echo
  echo "------------------------------------------------------------"
  echo "------------------------------------------------------------"
  echo
  echo "Hitting graphql endpoints"

  echo "Running on network:"
  for i in {1..20}; do
    exec_graphql "anon" "globals"
    [[ "$(echo $output | jq -r '.data.globals.network')" = 'regtest' ]] && break
    sleep 1
  done
  echo $output | jq -r '.data.globals.network'
  [[ "$(echo $output | jq -r '.data.globals.network')" = 'regtest' ]] || exit 1
  echo
  for i in {1..10}; do
    echo "Logging in Alice"
    login_user "alice" "+16505554328" "000000" && break
    sleep 1
  done

  initialize_user_from_onchain "alice" "+16505554328" "000000"
  bitcoin_cli -generate 3

  exec_graphql "alice" "wallets-for-account"
  echo $output

  echo "Alice account set up, token: $(read_value "alice")"
  
  echo "TOKEN_ALICE=$(read_value "alice")"
  export TOKEN_ALICE=$(read_value "alice")
}

main
