#!/bin/bash
# set -e
# set -x

echo "Setting up DEV_DIR variable"
DEV_DIR="$(dirname "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")")"
source "${DEV_DIR}/helpers/auth.sh"
source "${DEV_DIR}/helpers/onchain.sh"

user_phone="+16505554350"
token="$(login_user "${user_phone}")"
echo "Fetching wallets for account"

echo "Funding wallets"
sleep 20
fund_user_onchain "$token" "USD"
fund_user_onchain "$token" "BTC"
