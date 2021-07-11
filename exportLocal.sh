export NETWORK=regtest
export LND1_TLS=$(kubectl exec lnd1-0  -- base64 /data/.lnd/tls.cert | tr -d '\n\r')
export LND2_TLS=$(kubectl exec lnd2-0  -- base64 /data/.lnd/tls.cert | tr -d '\n\r')

export TLSOUTSIDE1=$(kubectl exec lnd-outside-1-0  -- base64 /data/.lnd/tls.cert | tr -d '\n\r')
export TLSOUTSIDE2=$(kubectl exec lnd-outside-2-0  -- base64 /data/.lnd/tls.cert | tr -d '\n\r')

export LND1_MACAROON=$(kubectl exec lnd1-0  -- base64 /data/.lnd/data/chain/bitcoin/$NETWORK/admin.macaroon | tr -d '\n\r')
export LND2_MACAROON=$(kubectl exec lnd2-0  -- base64 /data/.lnd/data/chain/bitcoin/$NETWORK/admin.macaroon | tr -d '\n\r')

export MACAROONOUTSIDE1=$(kubectl exec lnd-outside-1-0  -- base64 /data/.lnd/data/chain/bitcoin/$NETWORK/admin.macaroon | tr -d '\n\r')
export MACAROONOUTSIDE2=$(kubectl exec lnd-outside-2-0  -- base64 /data/.lnd/data/chain/bitcoin/$NETWORK/admin.macaroon | tr -d '\n\r')

export LND1_PUBKEY=$(kubectl get secret lnd1-pubkey --template={{.data.pubkey}} | base64 -d)
export LND2_PUBKEY=$(kubectl get secret lnd2-pubkey --template={{.data.pubkey}} | base64 -d)

# change 18443 to 18332 for testnet below

# note: grep -P doesn't work on mac out of the box
# workaround: https://stackoverflow.com/questions/16658333/grep-p-no-longer-works-how-can-i-rewrite-my-searches
export BITCOINDPORT=$(kubectl get services | awk '/bitcoind/ {print $5}' | grep -Po '18443:\K[0-9]+')

export MINIKUBEIP=$(minikube ip)
export BITCOINDADDR=$MINIKUBEIP
export BITCOINDRPCPASS=$(kubectl get secret bitcoind-rpcpassword --template={{.data.password}} | base64 -d)

export LND1_DNS=$MINIKUBEIP
export LND2_DNS=$MINIKUBEIP

# FIXME hacky ;exit; TODO: need to rename lnd to lnd-main such that it can be filtered properly
export LND1_RPCPORT=$(kubectl get services | awk '/lnd1/ {print $5;exit;}' | grep -Po '10009:\K[0-9]+')
export LND2_RPCPORT=$(kubectl get services | awk '/lnd2/ {print $5;exit;}' | grep -Po '10009:\K[0-9]+')

export LNDOUTSIDE1ADDR=$MINIKUBEIP
export LNDOUTSIDE1RPCPORT=$(kubectl get services | awk '/lnd-outside-1/ {print $5}' | grep -Po '10009:\K[0-9]+')

export LNDOUTSIDE2ADDR=$MINIKUBEIP
export LNDOUTSIDE2RPCPORT=$(kubectl get services | awk '/lnd-outside-2/ {print $5}' | grep -Po '10009:\K[0-9]+')

export MONGODB_ADDRESS="$MINIKUBEIP:"$(kubectl get services | awk '/mongodb/ {print $5}' | grep -Po '27017:\K[0-9]+')
export MONGODB_PASSWORD=$(kubectl get secret galoy-mongodb -o=go-template='{{index .data "mongodb-password" | base64decode}}')
export REDIS_PASSWORD=$(kubectl get secret galoy-redis -o=go-template='{{index .data "redis-password" | base64decode}}')

export REDIS_0_SENTINEL_PORT=$(kubectl get services galoy-redis | grep -Po '26379:\K[0-9]+')

export REDIS_0_PORT=$(kubectl get services galoy-redis | grep -Po '\b6379\b:\K[0-9]+')

export REDIS_0_INTERNAL_IP=$(kubectl get pod galoy-redis-node-0 -o wide | awk '{print $6}' | tail -1)
export REDIS_0_DNS=$MINIKUBEIP

export JWT_SECRET="jwt_secret"

export LOGLEVEL="debug"
export HELMREVISION=1

export CONFIG_REPO="https://github.com/GaloyMoney/configs"

export PRICE_ADDRESS=$MINIKUBEIP
export PRICE_PORT=$(kubectl get services | awk '/galoy-price/ {print $5}' | grep -Po '50051:\K[0-9]+')

export LOCAL=true
