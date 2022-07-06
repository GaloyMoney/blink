#!/bin/sh

# remove old macaroons
rm -rf ./dev/lnd/lnd-outside-1
rm -rf ./dev/lnd/loop.macaroon

# stop existing docker
docker compose stop loopserver
docker compose stop loopd

# copy macaroons from outside node (for use by mock loopserver)
lnd_outside_id=$(docker ps -q -f status=running -f name="lnd-outside-1")
docker cp "$lnd_outside_id:/root/.lnd" "./dev/lnd/lnd-outside-1"

# boot up the mock loopserver
docker compose up loopserver -d

# mine some bitcoin to sync the loopserver
make mine

# start the loop client with REST API
export LOOP_SERVER_INTERNAL_IP=$(docker inspect $(docker ps -q -f name="loopserver")  -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}')
echo "LOOP_SERVER_INTERNAL_IP is $LOOP_SERVER_INTERNAL_IP"
docker compose up loopd -d 

# copy loop macaroon to consume by the galoy app
loopd_id=$(docker ps -q -f name="loopd")
sleep 5 && docker cp "$loopd_id:/root/.loop/regtest/loop.macaroon" "./dev/lnd"

# test the Loop REST API with a quote request
echo "Loop macaroon:"
# convert macaroon to hex string
LOOP_MACAROON=$(cat dev/lnd/loop.macaroon | xxd -p |  awk '{print}' ORS='')
echo $LOOP_MACAROON
# test loop rest api
curl -k \
    --request GET \
    --url     https://localhost:8081/v1/loop/out/quote/500000 \
    --cert     dev/lnd/tls.cert \
    --key      dev/lnd/tls.key \
    --header  'Content-Type: application/json' \
    --header  "Grpc-Metadata-macaroon: $LOOP_MACAROON" \
    --verbose