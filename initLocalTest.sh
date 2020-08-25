set -e

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

# bug with --wait: https://github.com/helm/helm/issues/7139 ?
helm install --namespace=$NAMESPACE bitcoind -f ../../bitcoind-chart/values.yaml -f ../../bitcoind-chart/regtest-values.yaml --set serviceType=$SERVICETYPE ../../bitcoind-chart/
helm install --namespace=$NAMESPACE mongodb --set auth.username=testGaloy,auth.password=testGaloy,auth.database=galoy,persistence.enabled=false,service.type=$SERVICETYPE bitnami/mongodb
helm install --namespace=$NAMESPACE redis --set=cluster.enabled=false,usePassword=false,master.service.type=$SERVICETYPE,master.persistence.enabled=false	 bitnami/redis

sleep 8

kubectl wait --namespace=$NAMESPACE --for=condition=ready pod -l app=bitcoind-container --timeout=1200s
helm install --namespace=$NAMESPACE lnd -f ../../lnd-chart/values.yaml -f ../../lnd-chart/regtest-values.yaml --set lndService.serviceType=$SERVICETYPE ../../lnd-chart/

kubectl wait --namespace=$NAMESPACE --for=condition=ready pod -l app=redis --timeout=1200s
kubectl wait --namespace=$NAMESPACE --for=condition=ready pod -l app.kubernetes.io/component=mongodb --timeout=1200s

sleep 8

kubectl wait --namespace=$NAMESPACE --for=condition=ready pod -l app=lnd-container --timeout=1200s
