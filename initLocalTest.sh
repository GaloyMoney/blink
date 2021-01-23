set -e

helm repo add stable --force-update https://charts.helm.sh/stable
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts

cd ../../../infrastructure/graphql-chart && helm dependency build && cd -
cd ../../../infrastructure/monitoring && helm dependency build && cd -


if [ "$1" == "testnet" ] || [ "$1" == "mainnet" ];
then
  NETWORK="$1"
  NAMESPACE="$1"
  SERVICETYPE=ClusterIP
  INFRADIR=~/GaloyApp/infrastructure
else
  NETWORK="regtest"
  if [ ${LOCAL} ]; then 
    MINIKUBEIP=$(minikube ip)
    NAMESPACE="default"
    SERVICETYPE=LoadBalancer
    INFRADIR=../../../infrastructure
  else 
    SERVICETYPE=ClusterIP
    INFRADIR=~/GaloyApp/infrastructure
  fi
fi

helmUpgrade () {
  echo ""
  echo ""
  echo "---"
  echo "executing upgrade: helm upgrade -i -n=$NAMESPACE $@"
  command helm upgrade -i -n=$NAMESPACE "$@"
}

monitoringDeploymentsUpgrade() {
  SECRET=alertmanager-keys
  local NAMESPACE=monitoring
  # kubectl -n $NAMESPACE delete deployment.apps prometheus-kube-state-metrics

  export SLACK_API_URL=$(kubectl get secret -n $NAMESPACE $SECRET -o jsonpath="{.data.SLACK_API_URL}" | base64 -d)
  export SERVICE_KEY=$(kubectl get secret -n $NAMESPACE $SECRET -o jsonpath="{.data.SERVICE_KEY}" | base64 -d)

  helmUpgrade monitoring $INFRADIR/monitoring

  kubectl -n $NAMESPACE get configmaps monitoring-prometheus-alertmanager -o yaml | sed -e "s|SLACK_API_URL|$SLACK_API_URL|; s|SERVICE_KEY|$SERVICE_KEY|" | kubectl -n $NAMESPACE apply -f -
}

kubectlWait () {
  echo "waiting for -n=$NAMESPACE -l $@"
  sleep 6
  kubectl wait -n=$NAMESPACE --for=condition=ready --timeout=1200s pod -l "$@"
}

kubectlLndDeletionWait () {
# if the lnd pod needs upgrade, we want to make sure we wait for it to be removed. 
# otherwise it could be seen as ready by `kubectlWait app=lnd-container` while it could just have been in the process of still winding down
# we use || : to not return an error if the pod doesn't exist, or if no update is requiered (will timeout in this case)
# TODO: using --wait on upgrade would simplify this upgrade, but is currently running into some issues
  echo "waiting for pod deletion"
  kubectl wait -n=$NAMESPACE --for=delete --timeout=45s pod -l type=lnd || :
}

exportMacaroon() {
  export "$2"=$(kubectl exec -n=$NAMESPACE $1 -c lnd-container -- base64 /root/.lnd/data/chain/bitcoin/$NETWORK/admin.macaroon | tr -d '\n\r')
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
helmUpgrade bitcoind -f $INFRADIR/bitcoind-chart/$NETWORK-values.yaml --set serviceType=$SERVICETYPE $INFRADIR/bitcoind-chart/
kubectlWait app=bitcoind-container

# pod deletion has occured before the script started, but may not be completed yet
if [ ${LOCAL} ]
then
  kubectlLndDeletionWait
fi

helmUpgrade lnd -f $INFRADIR/lnd-chart/$NETWORK-values.yaml --set lndService.serviceType=LoadBalancer,minikubeip=$MINIKUBEIP $INFRADIR/lnd-chart/

# avoiding to spend time with circleci regtest with this condition
if [ "$1" == "testnet" ] || [ "$1" == "mainnet" ];
then
  kubectlLndDeletionWait
fi

# # add extra sleep time... seems lnd is quite long to show up some time
sleep 15
kubectlWait type=lnd


exportMacaroon lnd-container-0 MACAROON
export TLS=$(kubectl -n $NAMESPACE exec lnd-container-0 -c lnd-container -- base64 /root/.lnd/tls.cert | tr -d '\n\r')

# mongodb
if [ "$NETWORK" == "regtest" ]
then
  helmUpgrade mongodb --set auth.username=testGaloy,auth.password=testGaloy,auth.database=galoy,persistence.enabled=false,service.type=$SERVICETYPE bitnami/mongodb
else
  export MONGODB_ROOT_PASSWORD=$(kubectl get secret -n $NAMESPACE mongodb -o jsonpath="{.data.mongodb-root-password}" | base64 -d)
  export MONGODB_REPLICA_SET_KEY=$(kubectl get secret -n $NAMESPACE mongodb -o jsonpath="{.data.mongodb-replica-set-key}" | base64 -d)
  helmUpgrade mongodb -f $INFRADIR/mongo-chart/custom-values.yaml -f $INFRADIR/mongo-chart/$NETWORK-values.yaml bitnami/mongodb --set auth.rootPassword=$MONGODB_ROOT_PASSWORD,auth.replicaSetKey=$MONGODB_REPLICA_SET_KEY
  kubectl -n $NAMESPACE delete pod mongodb-2

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
  exportMacaroon lnd-container-outside-1-0 MACAROONOUTSIDE1
  exportMacaroon lnd-container-outside-2-0 MACAROONOUTSIDE2
  
  # Todo: refactor
  export TLSOUTSIDE1=$(kubectl -n $NAMESPACE exec lnd-container-outside-1-0 -c lnd-container -- base64 /root/.lnd/tls.cert | tr -d '\n\r')
  export TLSOUTSIDE2=$(kubectl -n $NAMESPACE exec lnd-container-outside-2-0 -c lnd-container -- base64 /root/.lnd/tls.cert | tr -d '\n\r')

  echo $(kubectl get -n=$NAMESPACE pods)

else
  createLoopConfigmaps
  helmUpgrade loop-server -f $INFRADIR/loop-server/$NETWORK-values.yaml $INFRADIR/loop-server/
fi

helmUpgrade graphql-server -f $INFRADIR/graphql-chart/$NETWORK-values.yaml --set \
  testpod.macaroonoutside1=$MACAROONOUTSIDE1,testpod.macaroonoutside2=$MACAROONOUTSIDE2,tag=$CIRCLE_SHA1,testpod.tlsoutside1=$TLSOUTSIDE1,testpod.tlsoutside2=$TLSOUTSIDE2,tls=$TLS,macaroon=$MACAROON \
  $INFRADIR/graphql-chart/

if [ "$NETWORK" == "regtest" ]
then

elif [ "$NETWORK" == "testnet" ]
then
  monitoringDeploymentsUpgrade
fi

kubectlWait app.kubernetes.io/component=mongodb

echo $(kubectl get -n=$NAMESPACE pods)

kubectl -n $NAMESPACE rollout status deployment graphql-server
if [[ "$?" -ne 0 ]]; then
  echo "Deployment failed"
  exit 1
fi
