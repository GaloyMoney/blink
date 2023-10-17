#!/bin/bash

if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <btc-address> <amount>"
    exit 1
fi

BTC_ADDRESS=$1
AMOUNT=$2

WALLET_NAME="test_wallet"
docker exec api-bitcoind-1 bitcoin-cli createwallet $WALLET_NAME || docker exec api-bitcoind-1 bitcoin-cli loadwallet $WALLET_NAME
REWARD_ADDRESS=$(docker exec api-bitcoind-1 bitcoin-cli getnewaddress)
docker exec api-bitcoind-1 bitcoin-cli generatetoaddress 101 $REWARD_ADDRESS
docker exec api-bitcoind-1 bitcoin-cli sendtoaddress $BTC_ADDRESS $AMOUNT

echo "Sent $AMOUNT BTC to $BTC_ADDRESS"
