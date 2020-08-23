export NETWORK=regtest
export TLS=$(kubectl exec lnd-container-0 -- base64 /root/.lnd/tls.cert | tr -d '\n\r')
export MACAROON=$(kubectl exec lnd-container-0 -- base64 /root/.lnd/data/chain/bitcoin/$NETWORK/admin.macaroon | tr -d '\n\r')
export MACAROONOUTSIDE1=$(kubectl exec lnd-container-1 -- base64 /root/.lnd/data/chain/bitcoin/$NETWORK/admin.macaroon | tr -d '\n\r')
export MACAROONOUTSIDE2=$(kubectl exec lnd-container-2 -- base64 /root/.lnd/data/chain/bitcoin/$NETWORK/admin.macaroon | tr -d '\n\r')

# change 18443 to 18332 for testnet below

# note: grep -P doesn't work on mac out of the box
# workaround: https://stackoverflow.com/questions/16658333/grep-p-no-longer-works-how-can-i-rewrite-my-searches
export BITCOINDPORT=$(kubectl get services | awk '/bitcoind-service/ {print $5}' | grep -Po '18443:\K[0-9]+')

export MINIKUBEIP=$(minikube ip)
export BITCOINDADDR=$MINIKUBEIP

export LNDIP=$MINIKUBEIP
export LNDRPCPORT=$(kubectl get services | awk '/lnd-service/ {print $5}' | grep -Po '10009:\K[0-9]+')

export LNDOUTSIDE1ADDR=$MINIKUBEIP
export LNDOUTSIDE1RPCPORT=$(kubectl get services | awk '/lnd-outside-1/ {print $5}' | grep -Po '10009:\K[0-9]+')

export LNDOUTSIDE2ADDR=$MINIKUBEIP
export LNDOUTSIDE2RPCPORT=$(kubectl get services | awk '/lnd-outside-2/ {print $5}' | grep -Po '10009:\K[0-9]+')

export MONGODB_ADDRESS="$MINIKUBEIP:"$(kubectl get services | awk '/mongodb/ {print $5}' | grep -Po '27017:\K[0-9]+')

export REDIS_PORT=$(kubectl get services | awk '/edis-master/ {print $5}' | grep -Po '6379:\K[0-9]+')
export REDIS_IP=$MINIKUBEIP

export JWT_SECRET="jwt_secret"

export GOOGLE_APPLICATION_CREDENTIALS="./galoyapp-firebase-serviceaccont.json"