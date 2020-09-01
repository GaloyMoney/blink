set -e

if [ "$NAMESPACE" == "testnet" ] || [ "$NAMESPACE" == "mainnet" ];
then
  NETWORK=$NAMESPACE
else
  NETWORK="regtest"
fi

if [ ${LOCAL} ]; then 
  SERVICETYPE=LoadBalancer; 

  # setting up short term token so that lnd can be pulled from gcr.io
  SECRETNAME=galoyapp.secret.com

  kubectl delete secret/$SECRETNAME

  kubectl create secret docker-registry $SECRETNAME \
    --docker-server=https://gcr.io \
    --docker-username=oauth2accesstoken \
    --docker-password="$(gcloud auth print-access-token)" \
    --docker-email=youremail@example.com

  kubectl patch serviceaccount default -p "{\"imagePullSecrets\": [{\"name\": \"$SECRETNAME\"}]}"
else 
  SERVICETYPE=ClusterIP; 
fi

helmUpgrade () {
  command helm upgrade -i -n $NAMESPACE "$@"
}

kubectlWait () {
  command kubectl wait -n=$NAMESPACE --for=condition=ready --timeout=1200s pod -l "$@"
}

# bug with --wait: https://github.com/helm/helm/issues/7139 ?
helmUpgrade bitcoind -f ../../bitcoind-chart/values.yaml -f ../../bitcoind-chart/$NETWORK-values.yaml --set serviceType=$SERVICETYPE ../../bitcoind-chart/
helmUpgrade redis --set=cluster.enabled=false,usePassword=false,master.service.type=$SERVICETYPE,master.persistence.enabled=false bitnami/redis

if [ "$NETWORK" == "regtest" ]
then
  helmUpgrade mongodb --set auth.username=testGaloy,auth.password=testGaloy,auth.database=galoy,persistence.enabled=false,service.type=$SERVICETYPE bitnami/mongodb
  sleep 8
  kubectl wait -n=$NAMESPACE --for=condition=ready pod -l app=bitcoind-container --timeout=1200s
fi

helmUpgrade lnd -f ../../lnd-chart/values.yaml -f ../../lnd-chart/$NETWORK-values.yaml --set lndService.serviceType=$SERVICETYPE ../../lnd-chart/

kubectlWait app=redis
kubectlWait app.kubernetes.io/component=mongodb
sleep 8
kubectlWait app=lnd-container

if [ ${LOCAL} ]
then
  exit 0
fi

export MACAROON=$(kubectl exec -n=$NAMESPACE lnd-container-0 -- base64 /root/.lnd/data/chain/bitcoin/$NETWORK/admin.macaroon | tr -d '\n\r')
export TLS=$(kubectl -n $NAMESPACE exec lnd-container-0 -- base64 /root/.lnd/tls.cert | tr -d '\n\r')

# gcloud container images add-tag gcr.io/${GOOGLE_PROJECT_ID}/test-image:latest gcr.io/${GOOGLE_PROJECT_ID}/test-image:${CIRCLE_SHA1} --quiet

helmUpgrade graphql-server -f ~/GaloyApp/backend/graphql-chart/$NETWORK-values.yaml --set tag=$CIRCLE_SHA1,tls=$TLS,macaroon=$MACAROON ~/GaloyApp/backend/graphql-chart/
#Have two branches for regtest because the sequence of install/upgrade commands seems to be important
#in order for devnet test job to pass
if [ "$NETWORK" == "regtest" ]
then
  export MACAROONOUTSIDE1=$(kubectl exec -n=$NAMESPACE lnd-container-1 -- base64 /root/.lnd/data/chain/bitcoin/$NETWORK/admin.macaroon | tr -d '\n\r')
  export MACAROONOUTSIDE2=$(kubectl exec -n=$NAMESPACE lnd-container-2 -- base64 /root/.lnd/data/chain/bitcoin/$NETWORK/admin.macaroon | tr -d '\n\r')
  
  helmUpgrade test-chart -f ~/GaloyApp/backend/test-chart/values.yaml --set \
  macaroon=$MACAROON,macaroonoutside1=$MACAROONOUTSIDE1,macaroonoutside2=$MACAROONOUTSIDE2 \
  ~/GaloyApp/backend/test-chart/

  echo $(kubectl get -n=$NAMESPACE pods)

  echo "Waiting for test-pod and graphql-server to come alive"

  kubectlWait app=test-chart
  kubectlWait app=graphql-server
else
  export MONGODB_ROOT_PASSWORD=$(kubectl get secret -n $NAMESPACE mongodb -o jsonpath="{.data.mongodb-root-password}" | base64 --decode)
  export MONGODB_REPLICA_SET_KEY=$(kubectl get secret -n $NAMESPACE mongodb -o jsonpath="{.data.mongodb-replica-set-key}" | base64 --decode)
  helmUpgrade mongodb -f ~/GaloyApp/backend/mongo-chart/custom-values.yaml bitnami/mongodb --set auth.rootPassword=$MONGODB_ROOT_PASSWORD,auth.replicaSetKey=$MONGODB_REPLICA_SET_KEY
  kubectlWait app.kubernetes.io/component=mongodb

  kubectl exec -n $NAMESPACE mongodb-0 -- bash -c "mongo admin -u root -p "$MONGODB_ROOT_PASSWORD" --eval \"db.adminCommand({setDefaultRWConcern:1,defaultWriteConcern:{'w':'majority'}})\""
  
  kubectl exec -n $NAMESPACE mongodb-0 -- bash -c "mongo admin -u root -p "$MONGODB_ROOT_PASSWORD" --eval \"c=rs.conf();c.writeConcernMajorityJournalDefault=false;rs.reconfig(c)\""

  
  helmUpgrade graphql-server -f ~/GaloyApp/backend/graphql-chart/$NETWORK-values.yaml --set tag=$CIRCLE_SHA1,tls=$TLS,macaroon=$MACAROON ~/GaloyApp/backend/graphql-chart/
  helmUpgrade prometheus-client -f ~/GaloyApp/backend/graphql-chart/prometheus-values.yaml --set tag=$CIRCLE_SHA1,tls=$TLS,macaroon=$MACAROON ~/GaloyApp/backend/graphql-chart/
  helmUpgrade trigger --set tag=$CIRCLE_SHA1,tls=$TLS,macaroon=$MACAROON ~/GaloyApp/backend/trigger-chart/

fi
