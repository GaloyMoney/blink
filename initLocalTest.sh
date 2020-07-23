if [ -z ${LOCAL} ]; then SERVICETYPE=LoadBalancer; else SERVICETYPE=ClusterIP; fi

helm install --namespace=$NAMESPACE bitcoind -f ../../bitcoind-chart/values.yaml -f ../../bitcoind-chart/regtest-values.yaml --set serviceType=$SERVICETYPE ../../bitcoind-chart/
helm install --namespace=$NAMESPACE mongodb --set auth.username=testGaloy,auth.password=testGaloy,auth.database=galoy,persistence.enabled=false,service.type=$SERVICETYPE bitnami/mongodb

kubectl wait --namespace=$NAMESPACE --for=condition=ready pod -l app=bitcoind-container

helm install --namespace=$NAMESPACE lnd -f ../../lnd-chart/values.yaml -f ../../lnd-chart/regtest-values.yaml --set lndService.serviceType=$SERVICETYPE ../../lnd-chart/

kubectl wait --namespace=$NAMESPACE --for=condition=ready pod -l app=lnd-container
kubectl wait --namespace=$NAMESPACE --for=condition=ready pod -l app.kubernetes.io/component=mongodb
