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
  echo "Seeding some regtest blocks..."
  bitcoind_init > /dev/null 2>&1
  echo "DONE"
  echo "Getting balance from bria..."
  for i in {1..20}; do
    bria_cli wallet-balance -w dev-wallet > /dev/null 2>&1 && break
    sleep 1
  done
  bria_cli wallet-balance -w dev-wallet > /dev/null 2>&1 || exit 1
  echo "DONE"
  echo "Running getinfo on lnd..."
  lnd_cli getinfo > /dev/null 2>&1
  echo "DONE"
  echo "Opening lnd-outside -> lnd channel"
  init_lnd_channel
  echo "DONE"
  echo
  echo "------------------------------------------------------------"
  echo "------------------------------------------------------------"
  echo
  echo "Hitting graphql endpoints"

  echo "Running on network:"
  for i in {1..10}; do
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
  echo "DONE"
}

main
