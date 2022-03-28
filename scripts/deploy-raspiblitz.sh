#!/bin/bash

# wget https://raw.githubusercontent.com/openoms/galoy/self-hosting/scripts/deploy-raspiblitz.sh -O deploy-raspiblitz.sh
# sh -x deploy-raspiblitz.sh on
# sh -x deploy-raspiblitz.sh web-wallet

#githubUser="GaloyMoney"
githubUser="openoms"

#githubBranch="main"
githubBranch="self-hosting"

# command info
if [ $# -eq 0 ] || [ "$1" = "-h" ] || [ "$1" = "-help" ]; then
  echo "
Script to install the Galoy stack.
deploy-raspiblitz.sh [on|off|web-wallet|price|test] [?githubUser] [?branch]
Installs the latest main by default.

Requirements:
RaspiBlitz v1.7.2+ patched to 'dev'
LND on Testnet activated"
  exit 1
fi

# install
if [ "$1" = "on" ]; then
  ################
  # Dependencies
  ################
  # https://github.com/GaloyMoney/charts/blob/main/charts/galoy/Chart.yaml

  # NodeJS
  /home/admin/config.scripts/bonus.nodejs.sh on

  # Docker
  /home/admin/config.scripts/blitz.docker.sh on

  # direnv
  if ! dpkg --list | grep direnv; then
    sudo apt-get update
    sudo apt-get install -y direnv
  fi

  # Yarn
  if dpkg --list | grep yarn; then
    echo "# Yarn is already installed"
    yarn --version
  else
    echo "# Install Yarn"
    curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
    echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
    sudo apt-get update
    sudo apt-get install -y yarn
  fi

  # redis
  # https://github.com/bitnami/charts/tree/master/bitnami/redis#redis-image-parameters
  # 6.2.6-debian-10-r142
  if [ $(redis-cli --version | grep -c "6.2.6") -lt 1 ]; then
    if ! gpg  /usr/share/keyrings/redis-archive-keyring.gpg 2>/dev/null; then
      curl -fsSL https://packages.redis.io/gpg | sudo gpg --dearmor -o /usr/share/keyrings/redis-archive-keyring.gpg
    fi
    echo "deb [signed-by=/usr/share/keyrings/redis-archive-keyring.gpg] https://packages.redis.io/deb $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/redis.list
    sudo apt-get update
    sudo apt-get install -y -o Dpkg::Options::='--force-confnew' redis #install the new config
  else
    echo "# Redis is already installed"
    redis-cli --version
  fi

  ## MongoDB - using the Docker image
  #https://github.com/bitnami/charts/tree/master/bitnami/mongodb#mongodb-parameters
  # 4.4.11-debian-10-r12

  #############################
  # User, symlinks, permissions
  #############################
  echo
  echo "# Create user and symlinks"
  sudo adduser --disabled-password --gecos "" galoy
  # passwordless access to sudo
  sudo adduser galoy sudo

  # add the user to the docker group
  sudo usermod -aG docker galoy

  # https://direnv.net/docs/hook.html
  echo 'eval "$(direnv hook bash)"' | sudo tee -a /home/galoy/.bashrc

  # symlink to the lnd data directory exists"
  sudo rm -rf /home/galoy/.lnd  # not a symlink.. delete it silently
  # create symlink
  sudo ln -s "/home/bitcoin/.lnd/" "/home/galoy/.lnd"
  sudo chmod -R 750 /home/galoy/.lnd/
  sudo /usr/sbin/usermod --append --groups lndadmin galoy
  sudo /usr/sbin/usermod --append --groups bitcoin galoy

  ################
  # Installation
  ################
  echo "# Clone galoy"
  cd /home/galoy/ || exit 1
  sudo -u galoy git clone https://github.com/${githubUser}/galoy
  cd galoy || exit 1
  # https://github.com/grpc/grpc-node/issues/1405
  sudo npm install -g grpc-tools  --target_arch=x64
  if [ ${#githubBranch} -gt 0 ]; then
    sudo -u galoy git checkout ${githubBranch}
  fi
  sudo -u galoy cp /home/galoy/galoy/scripts/assets/galoy-env ./.envrc
  sudo chmod +x .envrc
  sudo -u galoy cp /home/galoy/galoy/scripts/assets/galoy-docker-compose.yml ./docker-compose.yml
  sudo -u galoy cp /home/galoy/galoy/scripts/assets/galoy-Makefile ./Makefile
  echo "# Extract credentials from the bitcoin.conf"
  #TODO ?is the user hardcoded?
  #RPCuser=$(sudo cat /mnt/hdd/bitcoin/bitcoin.conf | grep rpcuser | cut -c 9-)
  RPCpassword=$(sudo cat /mnt/hdd/bitcoin/bitcoin.conf | grep rpcpassword | cut -c 13-)
  sudo -u galoy sed -i "s/export BITCOINDRPCPASS=.*/export BITCOINDRPCPASS=${RPCpassword}/g" ./.envrc
  # sudo -u galoy sh -c "./.envrc; direnv allow; yarn install --ignore-scripts"
  sudo -u galoy sh -c "direnv allow; ./.envrc; yarn install"

  ##############
  # Connections
  ##############
  # setup nginx symlinks
  # http://localhost:4000/graphql (old API - deprecated)
  # http://localhost:4001/graphql (admin API)
  # http://localhost:4002/graphql (new API)
  # galoy-admin-API_ssl
  if ! [ -f /etc/nginx/sites-available/galoy-admin-API_ssl.conf ]; then
    sudo cp /home/galoy/galoy/scripts/assets/galoy-admin-API_ssl.conf /etc/nginx/sites-available/galoy-admin-API_ssl.conf
  fi
  sudo ln -sf /etc/nginx/sites-available/galoy-admin-API_ssl.conf /etc/nginx/sites-enabled/

  # galoy-API_ssl
  if ! [ -f /etc/nginx/sites-available/galoy-API_ssl.conf ]; then
    sudo cp /home/galoy/galoy/scripts/assets/galoy-API_ssl.conf /etc/nginx/sites-available/galoy-API_ssl.conf
  fi
  sudo ln -sf /etc/nginx/sites-available/galoy-API_ssl.conf /etc/nginx/sites-enabled/

  sudo nginx -t || exit 1
  sudo systemctl reload nginx

  sudo ufw allow 4011 comment "galoy-admin-API_ssl"
  sudo ufw allow 4012 comment "galoy-API_ssl"

  # Tor not active as there is no password protection
  # /home/admin/config.scripts/tor.onion-service.sh galoy-admin-api 80 4001

  # sudo -u galoy make start-sh-deps
  # sudo -u galoy make start-sh
  # docker compose down
  # sudo -u galoy make reset-sh-deps
  echo "# Start with:"
  echo "sudo -u galoy sh -c 'cd /home/galoy/galoy; make start-sh'"

  localIP=$(hostname -I | awk '{print $1}')
  echo "# Connect to the Galoy admin API on: https://${localIP}:4011/graphql"
  echo "# Connect to the Galoy API on: https://${localIP}:4012/graphql"
fi

# https://github.com/GaloyMoney/web-wallet
if [ "$1" = "web-wallet" ]; then
  echo
  echo "# Build web-wallet"
  cd /home/galoy/ || exit 1
  githubUser="GaloyMoney"
  sudo -u galoy git clone https://github.com/${githubUser}/web-wallet
  cd web-wallet || exit 1
  if [ ${#githubBranch} -gt 0 ]; then
    sudo -u galoy git checkout ${githubBranch}
  fi

  # copy the edited env file
  sudo -u galoy cp /home/galoy/galoy/scripts/assets/web-wallet-env ./.envrc
  sudo chmod +x .envrc

  # dependencies
  sudo -u galoy docker compose down
  sudo -u galoy docker compose up
  # https://github.com/GaloyMoney/web-wallet#how-to-run-this-repo-locally
  sudo -u galoy yarn install

  # sudo -u galoy yarn dev:bundler
  ## new terminal
  #cd /home/galoy/web-wallet; sudo -u galoy yarn dev:server

 # sudo -u galoy sh -c ". ./.envrc; yarn build:all"
  #sudo -u galoy sh -c ". ./.envrc; yarn prod:start"

   ##################
   # SYSTEMD SERVICE
   ##################
   echo "# Install web-wallet systemd"
   echo "
# Systemd unit for the web-wallet
# /etc/systemd/system/web-wallet.service

[Unit]
Description=web-wallet daemon
Wants=lnd.service
After=lnd.service

[Service]
WorkingDirectory=/home/galoy/web-wallet
ExecStart=/usr/bin/sh -c 'yarn dev:bundler & sleep 30; /usr/bin/yarn dev:server
User=galoy
Restart=on-failure
TimeoutSec=120
RestartSec=30
StandardOutput=journal
StandardError=journal

# Hardening measures
PrivateTmp=true
ProtectSystem=full
NoNewPrivileges=true
PrivateDevices=true

[Install]
WantedBy=multi-user.target
" | sudo tee /etc/systemd/system/web-wallet.service
  sudo systemctl enable web-wallet
  sudo systemctl start web-wallet

  # galoy-web-wallet_ssl
  if ! [ -f /etc/nginx/sites-available/galoy-web-wallet_ssl.conf ]; then
    sudo cp /home/galoy/galoy/scripts/assets/web-wallet_ssl.conf /etc/nginx/sites-available/web-wallet_ssl.conf
  fi
  sudo ln -sf /etc/nginx/sites-available/web-wallet_ssl.conf /etc/nginx/sites-enabled/
  sudo nginx -t || exit 1
  sudo systemctl reload nginx
  sudo ufw allow 4031 comment "galoy-web-wallet_ssl"

  echo "# Monitor the service with:"
  echo "sudo journalctl -fu web-wallet"
  echo "# Connect to the web-wallet on: https://$(hostname -I|awk '{print $1}'):4031/graphql"
fi

# price
# build Docker image from the source - downloaded by default
if [ "$1" = "price" ]; then
  echo
  echo "# Build galoy-price"
  cd /home/galoy/ || exit 1
  githubUser="GaloyMoney"
  sudo -u galoy git clone https://github.com/${githubUser}/price.git
  if [ ${#githubBranch} -gt 0 ]; then
    sudo -u galoy git checkout ${githubBranch}
  fi
  cd price || exit 1
  sudo -u galoy docker build -f ./realtime/Dockerfile -t galoy-price .
  sudo -u galoy docker run galoy-price
fi

# test
if [ "$1" = "test" ]; then
  cd /home/galoy/galoy || exit 1
  sudo systemctl stop redis-server
  #sudo systemctl stop mongod
  sudo systemctl stop lnd
  TEST="01|02" make reset-integration
fi

if [ "$1" = "off" ]; then

  # web-wallet
  cd /home/galoy/web-wallet
  sudo -u galoy docker compose down
  sudo systemctl stop web-wallet
  sudo systemctl disable web-wallet
  sudo ufw deny 4031
  sudo rm /etc/nginx/sites-available/web-wallet_ssl.conf
  sudo rm /etc/nginx/sites-enabled/web-wallet_ssl.conf

  # galoy
  cd /home/galoy/galoy
  sudo -u galoy docker compose down
  sudo ufw deny 4011
  sudo ufw deny 4012
  # /home/admin/config.scripts/tor.onion-service.sh off galoy-admin-api
  sudo rm /etc/nginx/sites-available/galoy-admin-API_ssl.conf
  sudo rm /etc/nginx/sites-available/galoy-API_ssl.conf
  sudo rm /etc/nginx/sites-enabled/galoy-*

  # user
  sudo userdel -rf galoy

  sudo nginx -t || exit 1
  sudo systemctl reload nginx
fi
