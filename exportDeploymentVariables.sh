#TODO: merge exportLocal.sh with this file, and use for all exports within config.yaml
# NETWORK=$1
# NAMESPACE="default"
# if [ "$NETWORK" == "testnet" ] || [ "$NETWORK" == "mainnet" ]
# then
# 	NAMESPACE=$NETWORK
# fi

export MONGODB_ROOT_PASSWORD=$(kubectl get secret --namespace $NAMESPACE mongodb -o jsonpath="{.data.mongodb-root-password}" | base64 --decode)
export MONGODB_REPLICA_SET_KEY=$(kubectl get secret --namespace $NAMESPACE mongodb -o jsonpath="{.data.mongodb-replica-set-key}" | base64 --decode)
