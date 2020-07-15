helm install bitcoind -f ../../bitcoind-chart/regtest-values.yaml ../../bitcoind-chart/
helm install mongodb --set mongodbUsername=testGaloy,mongodbPassword=testGaloy,mongodbDatabase=galoy,persistence.enabled=false,service.type=LoadBalancer bitnami/mongodb

kubectl wait --for=condition=ready pod -l app=bitcoind-container

helm install lnd -f ../../lnd-chart/regtest-values.yaml ../../lnd-chart/

kubectl wait --for=condition=ready pod -l app=lnd-container
kubectl wait --for=condition=ready pod -l app=mongodb -timeout=-1
