set -e

# for helm < 3.4
# https://helm.sh/blog/new-location-stable-incubator-charts/
helm repo add stable https://charts.helm.sh/stable --force-update

helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo add jetstack https://charts.jetstack.io
helm repo add galoy https://galoymoney.github.io/charts/
helm repo update

lndVersion="1.2.12"
bitcoindVersion="0.2.2"

if [ ${LOCAL} ]
then
  localdevpath="--skip-refresh"
fi

git clean -fX

cd ./charts/galoy
helm dependency build $localdevpath
cd -

cd ./charts/monitoring
helm dependency build $localdevpath
cd -

INGRESS_NAMESPACE="ingress-nginx"
INFRADIR=./charts

backupMongodb () {
  JOB_DATE=$(date -u '+%s')
  kubectl -n=$NAMESPACE create job --from=cronjob/mongo-backup "$JOB_DATE"
  kubectl -n=$NAMESPACE wait --for=condition=complete --timeout=120s job/$JOB_DATE
  kubectl -n=$NAMESPACE delete job/$JOB_DATE
}


if [ "$1" == "testnet" ] || [ "$1" == "mainnet" ];
then
  NETWORK="$1"
  NAMESPACE="$1"

  backupMongodb

  # create namespaces if not exists
  kubectl create namespace $INGRESS_NAMESPACE --dry-run -o yaml | kubectl apply -f -
  kubectl create namespace cert-manager --dry-run -o yaml | kubectl apply -f -

  helm -n cert-manager upgrade -i cert-manager jetstack/cert-manager --set installCRDs=true --version=v1.2.0

  # Uncomment the following line if not using Google cloud and enter a static ip obtained from your cloud provider
  # export STATIC_IP=xxx.xxx.xxx.xxx

  # Comment the following line if not using Google cloud
  export STATIC_IP=$(gcloud compute addresses list | awk '/nginx-ingress/ {print $2}')

  helm -n $INGRESS_NAMESPACE upgrade -i ingress-nginx ingress-nginx/ingress-nginx --set controller.service.loadBalancerIP=$STATIC_IP \
  -f $INFRADIR/ingress-nginx-values.yaml
else
  NETWORK="regtest"
  if [ ${LOCAL} ]; then
    MINIKUBEIP=$(minikube ip)
    NAMESPACE="default"
  fi
fi

helmUpgrade () {
  echo ""
  echo ""
  echo "---"
  echo "executing upgrade: helm upgrade -i -n=$NAMESPACE $@"
  command helm upgrade -i -n=$NAMESPACE "$@"
}

helmUpgradeDebug () {
  echo ""
  echo ""
  echo "---"
  echo "executing upgrade: helm install --dry-run --debug -n=$NAMESPACE $@ > debug.yaml"
  command helm install --dry-run --debug -n=$NAMESPACE "$@" > debug.yaml
}

kubectlWait () {
  echo "waiting for -n=$NAMESPACE -l $@"
  sleep 6
  kubectl wait -n=$NAMESPACE --for=condition=ready --timeout=1200s pod -l "$@"
}

kubectlLndDeletionWait () {
# if the lnd pod needs upgrade, we want to make sure we wait for it to be removed.
# otherwise it could be seen as ready by `kubectlWait app=lnd` while it could just have been in the process of still winding down
# we use || : to not return an error if the pod doesn't exist, or if no update is requiered (will timeout in this case)
# TODO: using --wait on upgrade would simplify this upgrade, but is currently running into some issues
  echo "waiting for pod deletion"
  sleep 5
  kubectl wait -n=$NAMESPACE --for=delete --timeout=5s pod -l app.kubernetes.io/instance=lnd1 || :
  kubectl wait -n=$NAMESPACE --for=delete --timeout=5s pod -l app.kubernetes.io/instance=lnd2 || :
}

if [ ${LOCAL} ]
then
  localdevpath="-f $INFRADIR/configs/bitcoind/localdev.yaml"
fi

set +e
rm -rf tmp
mkdir tmp
git clone https://github.com/galoymoney/configs ./tmp
cp -R ./tmp/* $INFRADIR/configs/
set -e

helmUpgrade bitcoind $localdevpath -f $INFRADIR/configs/bitcoind/$NETWORK.yaml galoy/bitcoind --version=$bitcoindVersion

# bug with --wait: https://github.com/helm/helm/issues/7139 ?
kubectlWait app.kubernetes.io/name=bitcoind

sleep 8

if [ ${LOCAL} ]
then
  kubectlLndDeletionWait
  localdevpath="-f $INFRADIR/configs/lnd/localdev.yaml \
    --set service.staticIP=$MINIKUBEIP"
  localdevpathOutside="-f $INFRADIR/configs/lnd/localdev-outside.yaml \
    --set service.staticIP=$MINIKUBEIP"
fi

rm -rf $INFRADIR/lnd

helm pull --version=$lndVersion galoy/lnd -d $INFRADIR/ --untar

set +e
kubectl apply -f $INFRADIR/configs/lnd/templates
set -e


# for local development
# cp -R ../charts/charts/lnd/ $INFRADIR/lnd/
# cd charts/lnd
# helm dependency build
# cd -

helmUpgrade lnd1 --version=$lndVersion -f $INFRADIR/configs/lnd/$NETWORK.yaml $localdevpath $INFRADIR/lnd/ & \
helmUpgrade lnd2 --version=$lndVersion -f $INFRADIR/configs/lnd/$NETWORK.yaml $localdevpath --set persistence.existingClaim="lnd2" $INFRADIR/lnd/


# avoiding to spend time with circleci regtest with this condition
if [ "$NETWORK" == "testnet" ] || [ "$NETWORK" == "mainnet" ];
then
  kubectlLndDeletionWait
else
  helmUpgrade lnd-outside-1 --version=$lndVersion -f $INFRADIR/configs/lnd/$NETWORK.yaml $localdevpathOutside galoy/lnd & \
  helmUpgrade lnd-outside-2 --version=$lndVersion -f $INFRADIR/configs/lnd/$NETWORK.yaml $localdevpathOutside galoy/lnd
fi

# # add extra sleep time... seems lnd is quite long to show up some time
sleep 15
kubectlWait app.kubernetes.io/name=lnd

if [ ${LOCAL} ]
then
localdevpath="-f $INFRADIR/galoy/localdev.yaml"
fi

if [ "$NETWORK" == "testnet" ] || [ "$NETWORK" == "mainnet" ];
then
  configpath="-f $INFRADIR/configs/galoy/$NETWORK.yaml"
else
  configpath="-f $INFRADIR/galoy/$NETWORK.yaml"
fi

#FIXME: Fetch the entire secret once, then extract and decode the necessary fields
export MONGODB_ROOT_PASSWORD=$(kubectl get secret -n $NAMESPACE galoy-mongodb -o jsonpath="{.data.mongodb-root-password}" | base64 -d)
export MONGODB_PASSWORD=$(kubectl get secret -n $NAMESPACE galoy-mongodb -o jsonpath="{.data.mongodb-password}" | base64 -d)
export MONGODB_REPLICA_SET_KEY=$(kubectl get secret -n $NAMESPACE galoy-mongodb -o jsonpath="{.data.mongodb-replica-set-key}" | base64 -d)

# helmUpgradeDebug galoy \
#   $configpath $localdevpath \
#   --set mongodb.auth.password=$MONGODB_PASSWORD,mongodb.auth.rootPassword=$MONGODB_ROOT_PASSWORD,mongodb.auth.replicaSetKey=$MONGODB_REPLICA_SET_KEY,image.tag=$CIRCLE_SHA1 \
#   $INFRADIR/galoy/

helmUpgrade galoy \
  $configpath $localdevpath \
  --set mongodb.auth.password=$MONGODB_PASSWORD,mongodb.auth.rootPassword=$MONGODB_ROOT_PASSWORD,mongodb.auth.replicaSetKey=$MONGODB_REPLICA_SET_KEY,image.tag=$CIRCLE_SHA1 \
  $INFRADIR/galoy/

kubectlWait app.kubernetes.io/instance=galoy

if [ ${LOCAL} ]
then
  # FIXME: integrate to the helm chart instead
  kubectl expose pod galoy-redis-node-0 --load-balancer-ip='' --port=26379 --port=6379 --type="LoadBalancer" || : 
  exit 0
fi

if [ "$NETWORK" == "regtest" ]
then
  kubectlWait app=testpod
fi

if [ "$NETWORK" == "testnet" ]
then

  monitoringDeploymentsUpgrade() {
    SECRET=alertmanager-keys
    local NAMESPACE=monitoring

    helmUpgrade monitoring $INFRADIR/monitoring \
      --set prometheus-blackbox-exporter.config.modules.walletTestnetAuth.http.headers.Authorization="Bearer $TESTNET_TOKEN" \
      --set prometheus-blackbox-exporter.config.modules.walletMainnetAuth.http.headers.Authorization="Bearer $MAINNET_TOKEN"

    # FIXME: pass this directory to above command
    export SLACK_API_URL=$(kubectl get secret -n $NAMESPACE $SECRET -o jsonpath="{.data.SLACK_API_URL}" | base64 -d)
    export SERVICE_KEY=$(kubectl get secret -n $NAMESPACE $SECRET -o jsonpath="{.data.SERVICE_KEY}" | base64 -d)
    kubectl -n $NAMESPACE get configmaps monitoring-prometheus-alertmanager -o yaml | sed -e "s|SLACK_API_URL|$SLACK_API_URL|; s|SERVICE_KEY|$SERVICE_KEY|" | kubectl -n $NAMESPACE apply -f -
  }

  monitoringDeploymentsUpgrade
fi

echo $(kubectl get -n=$NAMESPACE pods)

if [[ "$?" -ne 0 ]]; then
  echo "Deployment for graphql failed"
  exit 1
fi

if [ "$NETWORK" == "testnet" ] || [ "$NETWORK" == "mainnet" ];
then

  kubectl -n $NAMESPACE annotate deployment graphql kubernetes.io/change-cause="$CIRCLE_SHA1-$(date -u)"

  kubectl -n $NAMESPACE rollout status deployments/trigger
  if [[ "$?" -ne 0 ]]; then
    echo "Deployment for trigger failed"
    exit 1
  fi

  kubectl -n $NAMESPACE rollout status deployments/exporter
  if [[ "$?" -ne 0 ]]; then
    echo "Deployment for exporter failed"
    exit 1
  fi
fi
