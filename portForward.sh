export NAMESPACE="krtk-devnet"
kill $(lsof -t -i:10009)
kill $(lsof -t -i:10010)
kill $(lsof -t -i:10011)
kill $(lsof -t -i:18443)
kill $(lsof -t -i:6379)
kill $(lsof -t -i:27019)

kubectl -n $NAMESPACE port-forward lnd-0 10009 &
kubectl -n $NAMESPACE port-forward bitcoind-container-0 18443 &
kubectl -n $NAMESPACE port-forward lnd-outside-1-0 10010:10009 &
kubectl -n $NAMESPACE port-forward $(kubectl -n $NAMESPACE get pod -l app.kubernetes.io/name=mongodb -o name) 27019:27017 &
kubectl -n $NAMESPACE port-forward lnd-outside-2-0 10011:10009 &
kubectl -n $NAMESPACE port-forward galoy-redis-master-0 6379 &
