set -e

helm repo add stable --force-update https://charts.helm.sh/stable
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo add jetstack https://charts.jetstack.io


cd ../../../infra/galoy && helm dependency build && cd -
cd ../../../infra/monitoring && helm dependency build && cd -

INGRESS_NAMESPACE="ingress-nginx"

if [ "$1" == "testnet" ] || [ "$1" == "mainnet" ];
then
  NETWORK="$1"
  NAMESPACE="$1"
  INFRADIR=~/GaloyApp/infra

  # create namespaces if not exists
  kubectl create namespace $INGRESS_NAMESPACE --dry-run -o yaml | kubectl apply -f -
  kubectl create namespace cert-manager --dry-run -o yaml | kubectl apply -f -

  helm -n cert-manager upgrade -i cert-manager jetstack/cert-manager --set installCRDs=true

  # Uncomment the following line if not using Google cloud and enter a static ip obtained from your cloud provider
  # export STATIC_IP=xxx.xxx.xxx.xxx

  # Comment the following line if not using Google cloud
  export STATIC_IP=$(gcloud compute addresses list | awk '/nginx-ingress/ {print $2}')

  helm -n $INGRESS_NAMESPACE upgrade -i ingress-nginx ingress-nginx/ingress-nginx --set controller.service.loadBalancerIP=$STATIC_IP
else
  NETWORK="regtest"
  if [ ${LOCAL} ]; then 
    MINIKUBEIP=$(minikube ip)
    NAMESPACE="default"
    INFRADIR=../../../infra
  else 
    INFRADIR=~/GaloyApp/infra
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
  local NAMESPACE=monitoring

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

if [ ${LOCAL} ] 
then 
localdevpath="-f $INFRADIR/bitcoind/localdev.yaml"
fi 
helmUpgrade bitcoind -f $INFRADIR/bitcoind/$NETWORK.yaml $localdevpath $INFRADIR/bitcoind/

# bug with --wait: https://github.com/helm/helm/issues/7139 ?
kubectlWait app=bitcoind-container

sleep 8

if [ ${LOCAL} ] 
then 
  kubectlLndDeletionWait
  localdevpath="-f $INFRADIR/lnd/localdev.yaml --set instances[0].staticIP=$MINIKUBEIP --set configmap[0].staticIP=$MINIKUBEIP "
fi 

helmUpgrade lnd -f $INFRADIR/lnd/$NETWORK.yaml $localdevpath $INFRADIR/lnd/

# avoiding to spend time with circleci regtest with this condition
if [ "$NETWORK" == "testnet" ] || [ "$NETWORK" == "mainnet" ];
then
  kubectlLndDeletionWait
fi

# # add extra sleep time... seems lnd is quite long to show up some time
sleep 15
kubectlWait type=lnd


exportMacaroon lnd-container-0 MACAROON
export TLS=$(kubectl -n $NAMESPACE exec lnd-container-0 -c lnd-container -- base64 /root/.lnd/tls.cert | tr -d '\n\r')

# mongodb
# if [ "$NETWORK" == "testnet" ] || [ "$NETWORK" == "mainnet" ];
# then
#   export MONGODB_ROOT_PASSWORD=$(kubectl get secret -n $NAMESPACE mongodb -o jsonpath="{.data.mongodb-root-password}" | base64 -d)
#   export MONGODB_REPLICA_SET_KEY=$(kubectl get secret -n $NAMESPACE mongodb -o jsonpath="{.data.mongodb-replica-set-key}" | base64 -d)
#   helmUpgrade mongodb -f $INFRADIR/mongo/custom.yaml -f $INFRADIR/mongo/$NETWORK.yaml bitnami/mongodb --set auth.rootPassword=$MONGODB_ROOT_PASSWORD,auth.replicaSetKey=$MONGODB_REPLICA_SET_KEY

#   # use initdbScripts instead
#   kubectl exec -n $NAMESPACE mongodb-0 -- bash -c "mongo admin -u root -p "$MONGODB_ROOT_PASSWORD" --eval \"db.adminCommand({setDefaultRWConcern:1,defaultWriteConcern:{'w':'majority'}})\""
#   kubectl exec -n $NAMESPACE mongodb-0 -- bash -c "mongo admin -u root -p "$MONGODB_ROOT_PASSWORD" --eval \"c=rs.conf();c.writeConcernMajorityJournalDefault=false;rs.reconfig(c)\""
# fi

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
  helmUpgrade loop-server $INFRADIR/lnd/charts/loop/
fi

if [ ${LOCAL} ]
then
localdevpath="-f $INFRADIR/galoy/localdev.yaml"
fi

export MONGODB_ROOT_PASSWORD=$(kubectl get secret -n $NAMESPACE galoy-mongodb -o jsonpath="{.data.mongodb-root-password}" | base64 -d)
export MONGODB_REPLICA_SET_KEY=$(kubectl get secret -n $NAMESPACE galoy-mongodb -o jsonpath="{.data.mongodb-replica-set-key}" | base64 -d)

helmUpgrade galoy \
  -f $INFRADIR/galoy/$NETWORK.yaml $localdevpath \
  --set testpod.macaroonoutside1=$MACAROONOUTSIDE1,testpod.macaroonoutside2=$MACAROONOUTSIDE2,tag=$CIRCLE_SHA1,testpod.tlsoutside1=$TLSOUTSIDE1,testpod.tlsoutside2=$TLSOUTSIDE2,tls=$TLS,macaroon=$MACAROON,mongodb.auth.rootPassword=$MONGODB_ROOT_PASSWORD,mongodb.auth.replicaSetKey=$MONGODB_REPLICA_SET_KEY \
  $INFRADIR/galoy/

kubectlWait app.kubernetes.io/component=mongodb
kubectlWait app=redis

if [ ${LOCAL} ]
then
  exit 0
fi

if [ "$NETWORK" == "regtest" ]
then
  kubectlWait app=testpod
fi

if [ "$NETWORK" == "testnet" ]
then
  monitoringDeploymentsUpgrade
fi

echo $(kubectl get -n=$NAMESPACE pods)

# kubectl -n $NAMESPACE rollout status deployment galoy
# if [[ "$?" -ne 0 ]]; then
#   echo "Deployment failed"
#   exit 1
# fi
