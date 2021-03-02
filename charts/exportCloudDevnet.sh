export NETWORK=regtest
export NAMESPACE="krtk-devnet"

if [ "$DELETE" = "false" ]; then
	echo "not deleting pods"	
else
	echo "deleting pods"
	kubectl -n $NAMESPACE delete pod -l app=bitcoind-container
	kubectl -n $NAMESPACE wait --for=condition=ready pod -l app=bitcoind-container
	kubectl -n $NAMESPACE delete pod -l app.kubernetes.io/name=mongodb
	kubectl -n $NAMESPACE delete pod -l type=lnd
	sleep 5
	kubectl -n $NAMESPACE wait --for=condition=ready pod -l type=lnd
	kubectl -n $NAMESPACE wait --for=condition=ready pod -l app.kubernetes.io/name=mongodb
fi

nohup ./portForward.sh &

export TLS=$(kubectl exec -n $NAMESPACE lnd-0  -- base64 /root/.lnd/tls.cert | tr -d '\n\r')
export TLSOUTSIDE1=$(kubectl exec -n $NAMESPACE lnd-outside-1-0  -- base64 /root/.lnd/tls.cert | tr -d '\n\r')
export TLSOUTSIDE2=$(kubectl exec  -n $NAMESPACE lnd-outside-2-0  -- base64 /root/.lnd/tls.cert | tr -d '\n\r')

export MACAROON=$(kubectl exec -n $NAMESPACE lnd-0  -- base64 /root/.lnd/data/chain/bitcoin/$NETWORK/admin.macaroon | tr -d '\n\r')
export MACAROONOUTSIDE1=$(kubectl exec -n $NAMESPACE lnd-outside-1-0  -- base64 /root/.lnd/data/chain/bitcoin/$NETWORK/admin.macaroon | tr -d '\n\r')
export MACAROONOUTSIDE2=$(kubectl exec -n $NAMESPACE lnd-outside-2-0  -- base64 /root/.lnd/data/chain/bitcoin/$NETWORK/admin.macaroon | tr -d '\n\r')


export LNDIP="localhost"
export LNDRPCPORT=10009


export BITCOINDPORT=18443
export BITCOINDADDR="localhost"


export LNDOUTSIDE1ADDR="localhost"
export LNDOUTSIDE1RPCPORT=10010


export MONGODB_ADDRESS="localhost:27019"

export LNDOUTSIDE2ADDR="localhost"
export LNDOUTSIDE2RPCPORT=10011


export REDIS_PORT=6379
export REDIS_IP=localhost

export JWT_SECRET="jwt_secret"

# export GOOGLE_APPLICATION_CREDENTIALS="./galoyapp-firebase-serviceaccont.json"

export LOGLEVEL="warn"
export HELMREVISION=1
