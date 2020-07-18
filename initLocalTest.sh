helm install --namespace=$NAMESPACE bitcoind -f ../../bitcoind-chart/regtest-values.yaml ../../bitcoind-chart/

if [ -z ${LOCAL+x} ]; then SERVICETYPE=ClusterIP; else SERVICETYPE=LoadBalancer; fi
helm install --namespace=$NAMESPACE mongodb --set auth.username=testGaloy,auth.password=testGaloy,auth.database=galoy,persistence.enabled=false,service.type=$SERVICETYPE bitnami/mongodb

kubectl wait --namespace=$NAMESPACE --for=condition=ready pod -l app=bitcoind-container

helm install --namespace=$NAMESPACE lnd -f ../../lnd-chart/regtest-values.yaml ../../lnd-chart/

kubectl wait --namespace=$NAMESPACE --for=condition=ready pod -l app=lnd-container
kubectl wait --namespace=$NAMESPACE --for=condition=ready pod -l app.kubernetes.io/component=mongodb
