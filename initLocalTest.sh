set -e

helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update


if [ "$1" == "testnet" ] || [ "$1" == "mainnet" ];
then
  REDISPERSISTENCE="true"
  NETWORK="$1"
  NAMESPACE="$1"
else
  NETWORK="regtest"
  REDISPERSISTENCE="false"
fi

if [ ${LOCAL} ]; then 
  MINIKUBEIP=$(minikube ip)
  NAMESPACE="default"
  SERVICETYPE=LoadBalancer; 
else 
  SERVICETYPE=ClusterIP; 
fi

helmUpgrade () {
  echo ""
  echo ""
  echo "---"
  echo "executing upgrade: helm upgrade -i -n=$NAMESPACE $@"
  command helm upgrade -i -n=$NAMESPACE "$@"
}

kubectlWait () {
  echo "waiting for -n=$NAMESPACE -l $@"
  sleep 5
  kubectl wait -n=$NAMESPACE --for=condition=ready --timeout=1200s pod -l "$@"
}

exportMacaroon() {
  export "$2"=$(kubectl exec -n=$NAMESPACE lnd-container-"$1" -c lnd-container -- base64 /root/.lnd/data/chain/bitcoin/$NETWORK/admin.macaroon | tr -d '\n\r')
}

createLoopConfigmaps() {
  kubectl -n $NETWORK cp lnd-container-0:/root/.lnd/tls.cert ./tls.cert -c lnd-container
  kubectl create configmap lndtls --from-file=./tls.cert --dry-run -o yaml | kubectl -n $NETWORK apply -f -

  kubectl -n $NETWORK cp lnd-container-0:/root/.lnd/data/chain/bitcoin/$NETWORK/admin.macaroon ./macaroon/admin.macaroon -c lnd-container
  kubectl -n $NETWORK cp lnd-container-0:/root/.lnd/data/chain/bitcoin/$NETWORK/readonly.macaroon ./macaroon/readonly.macaroon -c lnd-container
  kubectl -n $NETWORK cp lnd-container-0:/root/.lnd/data/chain/bitcoin/$NETWORK/invoices.macaroon ./macaroon/invoices.macaroon -c lnd-container
  kubectl -n $NETWORK cp lnd-container-0:/root/.lnd/data/chain/bitcoin/$NETWORK/chainnotifier.macaroon ./macaroon/chainnotifier.macaroon -c lnd-container
  kubectl -n $NETWORK cp lnd-container-0:/root/.lnd/data/chain/bitcoin/$NETWORK/signer.macaroon ./macaroon/signer.macaroon -c lnd-container
  kubectl -n $NETWORK cp lnd-container-0:/root/.lnd/data/chain/bitcoin/$NETWORK/walletkit.macaroon ./macaroon/walletkit.macaroon -c lnd-container
  kubectl -n $NETWORK cp lnd-container-0:/root/.lnd/data/chain/bitcoin/$NETWORK/router.macaroon ./macaroon/router.macaroon -c lnd-container
  kubectl create configmap lndmacaroon --from-file=./macaroon --dry-run -o yaml | kubectl -n $NETWORK apply -f -
}

# bug with --wait: https://github.com/helm/helm/issues/7139 ?
helmUpgrade bitcoind ../../bitcoind-chart/ -f ../../bitcoind-chart/values.yaml -f ../../bitcoind-chart/$NETWORK-values.yaml --set serviceType=$SERVICETYPE  
kubectlWait app=bitcoind-container

helmUpgrade lnd -f ../../lnd-chart/values.yaml -f ../../lnd-chart/$NETWORK-values.yaml --set lndService.serviceType=$SERVICETYPE,minikubeip=$MINIKUBEIP ../../lnd-chart/

# if the lnd pod exist, we want to make sure we wait for it to be removed. otherwise it could be seen as ready by `kubectlWait app=lnd-container` while it could just have been in the process of still winding down
# we use || : to not return an error if the pod doesn't exist
echo "deleting previous lnds, if the pod already exist"
kubectl wait -n=$NAMESPACE --for=delete --timeout=60s pod -l app=lnd-container || :

# add extra 10 seconds... seems lnd is quite long to show up some time
sleep 10
kubectlWait app=lnd-container

exportMacaroon 0 MACAROON
export TLS=$(kubectl -n $NAMESPACE exec lnd-container-0 -c lnd-container -- base64 /root/.lnd/tls.cert | tr -d '\n\r')

helmUpgrade redis bitnami/redis --set=master.service.type=$SERVICETYPE --set=master.persistence.enabled=$REDISPERSISTENCE --set=usePassword=false --set=image.tag=6.0.8-debian-10-r0  --set=cluster.slaveCount=0

# mongodb
if [ "$NETWORK" == "regtest" ]
then
  helmUpgrade mongodb --set auth.username=testGaloy,auth.password=testGaloy,auth.database=galoy,persistence.enabled=false,service.type=$SERVICETYPE bitnami/mongodb
else
  export MONGODB_ROOT_PASSWORD=$(kubectl get secret -n $NAMESPACE mongodb -o jsonpath="{.data.mongodb-root-password}" | base64 -d)
  export MONGODB_REPLICA_SET_KEY=$(kubectl get secret -n $NAMESPACE mongodb -o jsonpath="{.data.mongodb-replica-set-key}" | base64 -d)
  helmUpgrade mongodb -f ~/GaloyApp/backend/mongo-chart/custom-values.yaml bitnami/mongodb --set auth.rootPassword=$MONGODB_ROOT_PASSWORD,auth.replicaSetKey=$MONGODB_REPLICA_SET_KEY

  kubectl exec -n $NAMESPACE mongodb-0 -- bash -c "mongo admin -u root -p "$MONGODB_ROOT_PASSWORD" --eval \"db.adminCommand({setDefaultRWConcern:1,defaultWriteConcern:{'w':'majority'}})\""
  kubectl exec -n $NAMESPACE mongodb-0 -- bash -c "mongo admin -u root -p "$MONGODB_ROOT_PASSWORD" --eval \"c=rs.conf();c.writeConcernMajorityJournalDefault=false;rs.reconfig(c)\""
fi

if [ ${LOCAL} ]
then
  kubectlWait app.kubernetes.io/component=mongodb
  exit 0
fi

if [ "$NETWORK" == "regtest" ]
then
  exportMacaroon 1 MACAROONOUTSIDE1
  exportMacaroon 2 MACAROONOUTSIDE2
  
  # Todo: refactor
  export TLSOUTSIDE1=$(kubectl -n $NAMESPACE exec lnd-container-1 -c lnd-container -- base64 /root/.lnd/tls.cert | tr -d '\n\r')
  export TLSOUTSIDE2=$(kubectl -n $NAMESPACE exec lnd-container-2 -c lnd-container -- base64 /root/.lnd/tls.cert | tr -d '\n\r')

  helmUpgrade test-chart -f ~/GaloyApp/backend/test-chart/values.yaml --set \
  macaroon=$MACAROON,macaroonoutside1=$MACAROONOUTSIDE1,macaroonoutside2=$MACAROONOUTSIDE2,image.tag=$CIRCLE_SHA1,tlsoutside1=$TLSOUTSIDE1,tlsoutside2=$TLSOUTSIDE2,tls=$TLS \
  ~/GaloyApp/backend/test-chart/

  echo $(kubectl get -n=$NAMESPACE pods)
  echo "Waiting for test-pod and graphql-server to come alive"

else
  helmUpgrade prometheus-client -f ~/GaloyApp/backend/graphql-chart/prometheus-values.yaml --set tag=$CIRCLE_SHA1,tls=$TLS,macaroon=$MACAROON ~/GaloyApp/backend/graphql-chart/
  helmUpgrade trigger --set image.tag=$CIRCLE_SHA1,tls=$TLS,macaroon=$MACAROON ~/GaloyApp/backend/trigger-chart/

  createLoopConfigmaps
  helmUpgrade loop-server -f ~/GaloyApp/backend/loop-server/$NETWORK-values.yaml ~/GaloyApp/backend/loop-server/
  # TODO: missing kubectlWait trigger and prometheus-client
fi

helmUpgrade graphql-server -f ~/GaloyApp/backend/graphql-chart/$NETWORK-values.yaml --set tag=$CIRCLE_SHA1,tls=$TLS,macaroon=$MACAROON ~/GaloyApp/backend/graphql-chart/

if [ "$NETWORK" == "regtest" ]
then
  kubectlWait app=test-chart
fi

kubectlWait app=redis
kubectlWait app.kubernetes.io/component=mongodb
kubectlWait app=graphql-server