kubectl delete pod bitcoind-0
kubectl delete pod -l app=redis
kubectl delete pod -l app.kubernetes.io/component=mongodb

kubectl wait pod bitcoind-0 --for=condition=ready

kubectl delete pod lnd-0 lnd-outside-1-0 lnd-outside-2-0

kubectl wait pod lnd-0 lnd-outside-1-0 lnd-outside-2-0 --for=condition=ready
kubectl wait pod -l app.kubernetes.io/component=mongodb --for=condition=ready
kubectl wait pod -l app.kubernetes.io/name=redis --for=condition=ready
