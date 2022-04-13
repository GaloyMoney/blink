#!/bin/bash

## how to use:
## download
# wget https://raw.githubusercontent.com/openoms/galoy/self-hosting/scripts/deploy-raspiblitz.sh -O deploy-raspiblitz.sh
## run
# bash deploy-raspiblitz.sh on

## command info
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

## install vars
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

#TODO menu

## install
if [ "$1" = "on" ]; then
  #################
  ## Dependencies
  #################
  ## https://github.com/GaloyMoney/charts/blob/main/charts/galoy/Chart.yaml

  ## Docker
  /home/admin/config.scripts/blitz.docker.sh on

  ## direnv
  if ! dpkg --list | grep direnv; then
    sudo apt-get update
    sudo apt-get install -y direnv
  fi

  ## NodeJS
  /home/admin/config.scripts/bonus.nodejs.sh on

  ## Yarn
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

  ## redis
  ## https://github.com/bitnami/charts/tree/master/bitnami/redis#redis-image-parameters
  ## 6.2.6-debian-10-r142
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
  ## make sure to listen on the docker host
  if ! sudo cat /etc/redis/redis.conf | grep "^bind 127.0.0.1 -172.17.0.1"; then
    echo "bind 127.0.0.1 -172.17.0.1" | sudo tee -a /etc/redis/redis.conf
  fi

  ## MongoDB - using the Docker image
  ##https://github.com/bitnami/charts/tree/master/bitnami/mongodb#mongodb-parameters
  ## 4.4.11-debian-10-r12

  ##############################
  ## User, symlinks, permissions
  ##############################
  echo
  echo "# Create user and symlinks"
  sudo adduser --disabled-password --gecos "" galoy

  ## add the user to the docker group
  sudo usermod -aG docker galoy

  ## https://direnv.net/docs/hook.html
  echo 'eval "$(direnv hook bash)"' | sudo tee -a /home/galoy/.bashrc

  ## symlink to the lnd data directory exists"
  sudo rm -rf /home/galoy/.lnd  # not a symlink.. delete it silently
  ## create symlink
  sudo ln -s "/home/bitcoin/.lnd/" "/home/galoy/.lnd"
  sudo chmod -R 750 /home/galoy/.lnd/
  sudo /usr/sbin/usermod --append --groups lndadmin galoy
  sudo /usr/sbin/usermod --append --groups bitcoin galoy

  ################
  ## Installation
  ################
  echo "# Clone galoy"
  cd /home/galoy/ || exit 1
  sudo -u galoy git clone https://github.com/${githubUser}/galoy
  cd galoy || exit 1

  ## https://github.com/grpc/grpc-node/issues/1405
  #sudo -u galoy npm install grpc-tools --target_arch=x64

  if [ ${#githubBranch} -gt 0 ]; then
    sudo -u galoy git checkout ${githubBranch}
  fi

  sudo -u galoy chmod +x ./scripts/*.sh

  #TODO ?test if tlsextraip=DOCKER_HOST_IP is needed in lnd.conf

  ## build libs as in https://github.com/GaloyMoney/galoy/blob/main/Dockerfile
  sudo -u galoy yarn install --frozen-lockfile
  sudo -u galoy yarn build

  # trigger.service
  echo "\
# Systemd unit for trigger.js
# /etc/systemd/system/trigger.service

[Unit]
Description=trigger daemon
Wants=lnd.service
After=lnd.service

[Service]
WorkingDirectory=/home/galoy/galoy/
# dotenv gets the values from /home/galoy/galoy/.env
ExecStart=sh -c 'dotenv run node lib/servers/trigger.js'
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
" | sudo tee /etc/systemd/system/trigger.service
  sudo systemctl enable trigger
  source <(/home/admin/_cache.sh get state)
  if [ "${state}" == "ready" ]; then
    echo "# OK - the trigger.service is enabled, system is ready so starting service"
    sudo systemctl start trigger
  else
    echo "# OK - the trigger.service is enabled, to start manually use: 'sudo systemctl start trigger'"
  fi

  # cron,js
  # dotenv gets the values from /home/galoy/galoy/.env
  cronjob="0 2 * * * dotenv run node /home/galoy/galoy/lib/servers/cron.js"
  if [ $(sudo crontab -u galoy -l | grep -c "${cronjob}") -eq 0 ]; then
    echo "# Schedule cron.js"
    (sudo crontab -u galoy -l; echo "${cronjob}" ) | sudo crontab -u galoy -
  fi
  echo "# The crontab for galoy now is:"
  sudo crontab -u galoy -l
  echo

  #TODO push notifications

  ## galoy-api.service
  echo "\
# Systemd unit for galoy-api
# /etc/systemd/system/galoy-api.service

[Unit]
Description=galoy-api docker with deps
Wants=lnd.service trigger.service
After=lnd.service trigger.service

[Service]
WorkingDirectory=/home/galoy/galoy
ExecStart=make start-selfhosted-api
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
" | sudo tee /etc/systemd/system/galoy-api.service
  sudo systemctl enable galoy-api.service
  sudo systemctl start galoy-api.service

  ##############
  ## Connections
  ##############
  ## setup nginx symlinks
  ## http://localhost:4002/graphql (new API)

  ## galoy-api_ssl
  if ! [ -f /etc/nginx/sites-available/galoy-api_ssl.conf ]; then
    sudo cp /home/galoy/galoy/scripts/assets/galoy-api_ssl.conf /etc/nginx/sites-available/galoy-api_ssl.conf
  fi
  sudo ln -sf /etc/nginx/sites-available/galoy-api_ssl.conf /etc/nginx/sites-enabled/

  sudo nginx -t || exit 1
  sudo systemctl reload nginx
  sudo ufw allow 4012 comment "galoy-api_ssl"

  echo "# Monitor with: "
  echo "docker container logs -f --details galoy-api-1"
  localIP=$(hostname -I | awk '{print $1}')
  echo "# Connect to the Galoy API on: https://${localIP}:4012/graphql"
fi

if [ "$1" = "off" ]; then
  ## trigger
  sudo systemctl stop trigger
  sudo systemctl disable trigger

  ## galoy-api
  sudo systemctl stop galoy-api
  sudo systemctl disable galoy-api
  cd /home/galoy/galoy
  docker compose -f docker-compose.selfhosted.yml down
  sudo ufw deny 4012
  sudo rm /etc/nginx/sites-available/galoy-api_ssl.conf
  sudo rm /etc/nginx/sites-enabled/galoy-*
  ## user
  sudo userdel -rf galoy

  sudo nginx -t || exit 1
  sudo systemctl reload nginx
fi
