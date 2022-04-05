#!/bin/bash

# wget https://raw.githubusercontent.com/openoms/galoy/self-hosting/scripts/deploy-raspiblitz.sh -O deploy-raspiblitz.sh
# sh -x deploy-raspiblitz.sh on
# sh -x deploy-raspiblitz.sh web-wallet

# command info
if [ $# -eq 0 ] || [ "$1" = "-h" ] || [ "$1" = "-help" ]; then
  echo "
Script to install the Galoy stack.
deploy-raspiblitz.sh [on|off] [?testnet|mainnet] [?githubUser] [?branch]
Installs the latest main by default.

Requirements:
RaspiBlitz v1.7.2+ patched to 'dev'
LND on Testnet activated"
  exit 1
fi

# install vars
if [ $# -gt 1 ]; then
  NETWORK="$2"
else
  NETWORK="testnet"
fi

if [ $# -gt 2 ]; then
  githubUser="$3"
else
  #githubUser="GaloyMoney"
  githubUser="openoms"
fi

if [ $# -gt 3 ]; then
  githubBranch="$4"
else
  #githubBranch="main"
  githubBranch="self-hosting"
fi

# install
if [ "$1" = "on" ]; then
  ################
  # Dependencies
  ################
  # https://github.com/GaloyMoney/charts/blob/main/charts/galoy/Chart.yaml

  # NodeJS
  #/home/admin/config.scripts/bonus.nodejs.sh on

  # Docker
  /home/admin/config.scripts/blitz.docker.sh on

  # direnv
  if ! dpkg --list | grep direnv; then
    sudo apt-get update
    sudo apt-get install -y direnv
  fi

  # # Yarn
  # if dpkg --list | grep yarn; then
  #   echo "# Yarn is already installed"
  #   yarn --version
  # else
  #   echo "# Install Yarn"
  #   curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
  #   echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
  #   sudo apt-get update
  #   sudo apt-get install -y yarn
  # fi

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

#  sudo -u galoy cp /home/galoy/galoy/scripts/assets/galoy-env ./.envrc
#   sudo chmod +x .envrc
#   echo "# Set NETWORK"
#   sudo -u galoy sed -i "s/export NETWORK=.*/export NETWORK=${NETWORK}/g" ./.envrc
#   sudo -u galoy sed -i "s/export NODE_ENV=.*/export NODE_ENV=production/g" ./.envrc
# 
#   echo "# Set RPCPORTS"
#   source <(/home/admin/config.scripts/network.aliases.sh getvars lnd ${NETWORK})
#   sudo -u galoy sed -i "s/export LND1_RPCPORT=.*/export LND1_RPCPORT=1${L2rpcportmod}009/g" ./.envrc
#   sudo -u galoy sed -i "s/export LND2_RPCPORT=.*/export LND2_RPCPORT=1${L2rpcportmod}009/g" ./.envrc
#   sudo -u galoy sed -i "s/export LNDONCHAIN_RPCPORT=.*/export LNDONCHAIN_RPCPORT=1${L2rpcportmod}009/g" ./.envrc
#   sudo -u galoy sed -i "s/export LNDOUTSIDE1RPCPORT=.*/export LNDOUTSIDE1RPCPORT=1${L2rpcportmod}009/g" ./.envrc
#   sudo -u galoy sed -i "s/export LNDOUTSIDE2RPCPORT=.*/export LNDOUTSIDE2RPCPORT=1${L2rpcportmod}009/g" ./.envrc

  #TODO ?test if tlsextraip=DOCKER_HOST_IP i needed in lnd.conf

  # sudo -u galoy sh -c "direnv allow; ./.envrc; yarn install"
  sudo -u galoy make start-selfhosted-deps
  sudo -u galoy make start-selfhosted-api

  ##############
  # Connections
  ##############
  # setup nginx symlinks
  # http://localhost:4000/graphql (old API - deprecated)
  # http://localhost:4001/graphql (admin API)
  # http://localhost:4002/graphql (new API)

  # # galoy-admin-api_ssl - not active in Docker
  # if ! [ -f /etc/nginx/sites-available/galoy-admin-api_ssl.conf ]; then
  #   sudo cp /home/galoy/galoy/scripts/assets/galoy-admin-api_ssl.conf /etc/nginx/sites-available/galoy-admin-api_ssl.conf
  # fi
  # sudo ln -sf /etc/nginx/sites-available/galoy-admin-api_ssl.conf /etc/nginx/sites-enabled/
  # sudo ufw allow 4011 comment "galoy-admin-api_ssl"

  DOCKER_HOST_IP=$(ip addr show docker0 | awk '/inet/ {print $2}' | cut -d'/' -f1)
  # galoy-api_ssl
  if ! [ -f /etc/nginx/sites-available/galoy-api_ssl.conf ]; then
    sudo cp /home/galoy/galoy/scripts/assets/galoy-api_ssl.conf /etc/nginx/sites-available/galoy-api_ssl.conf
  fi
  sudo ln -sf /etc/nginx/sites-available/galoy-api_ssl.conf /etc/nginx/sites-enabled/
  # BACKEND_ADDRESS=$(docker container inspect -f '{{ .NetworkSettings.Networks.galoy_default.IPAddress }}' galoy-api-1)
  sudo sed -i "s#proxy_pass http://127.0.0.1:4002;#proxy_pass http://$DOCKER_HOST_IP:4002;#g" /etc/nginx/sites-available/galoy-api_ssl.conf

  sudo nginx -t || exit 1
  sudo systemctl reload nginx
  sudo ufw allow 4012 comment "galoy-api_ssl"

  echo "# Monitor with: "
  echo "docker container logs -f --details galoy-api-1"
  localIP=$(hostname -I | awk '{print $1}')
  # echo "# Connect to the Galoy admin API on: https://${localIP}:4011/graphql"
  echo "# Connect to the Galoy API on: https://${localIP}:4012/graphql"
fi

if [ "$1" = "off" ]; then
  # galoy
  cd /home/galoy/galoy
  sudo -u galoy docker compose down
  sudo ufw deny 4011
  sudo ufw deny 4012
  # /home/admin/config.scripts/tor.onion-service.sh off galoy-admin-api
  sudo rm /etc/nginx/sites-available/galoy-admin-api_ssl.conf
  sudo rm /etc/nginx/sites-available/galoy-api_ssl.conf
  sudo rm /etc/nginx/sites-enabled/galoy-*

  # user
  sudo userdel -rf galoy

  sudo nginx -t || exit 1
  sudo systemctl reload nginx
fi
