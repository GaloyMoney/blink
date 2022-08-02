#!/bin/sh

# remove old macaroons
rm -rf ./dev/lnd/lnd-outside-1
rm -rf ./dev/lnd/loop.macaroon

# stop existing docker
docker compose stop loopserver
docker compose stop loopd1
docker compose stop loopd2

# copy macaroons from outside node (for use by mock loopserver)
lnd_outside_id=$(docker ps -q -f status=running -f name="lnd-outside-1")
docker cp "$lnd_outside_id:/root/.lnd" "./dev/lnd/lnd-outside-1"

# boot up the mock loopserver
docker compose up loopserver -d

# mine some bitcoin to sync the loopserver
make mine-block

# start the loop client with REST API
export LOOP_SERVER_INTERNAL_IP=$(docker inspect $(docker ps -q -f name="loopserver")  -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}')
echo "LOOP_SERVER_INTERNAL_IP is $LOOP_SERVER_INTERNAL_IP"
docker compose up loopd1 -d 
docker compose up loopd2 -d 

# copy loop macaroon and tls.cert for lnd1 to consume by the galoy app
loopd1_id=$(docker ps -q -f name="loopd1-1")
sleep 5 && docker cp "$loopd1_id:/root/.loop/regtest/loop.macaroon" "./dev/lnd/lnd1-loop.macaroon" && \
docker cp "$loopd1_id:/root/.loop/regtest/tls.cert" "./dev/lnd/lnd1-loop-tls.cert"

# copy loop macaroon and tls.cert for lnd2 to consume by the galoy app
loopd2_id=$(docker ps -q -f name="loopd2-1")
sleep 5 && docker cp "$loopd2_id:/root/.loop/regtest/loop.macaroon" "./dev/lnd/lnd2-loop.macaroon" && \
docker cp "$loopd2_id:/root/.loop/regtest/tls.cert" "./dev/lnd/lnd2-loop-tls.cert"

# test the lnd1-loop REST API with a quote request
echo "loop1 results"
LOOP1_MACAROON_HEXSTR=$(cat dev/lnd/lnd1-loop.macaroon | xxd -p |  awk '{print}' ORS='')
# echo $LOOP1_MACAROON_HEXSTR
# test loop rest api
curl -k \
    --request GET \
    --url     https://localhost:8081/v1/loop/out/quote/500000 \
    --header  'Content-Type: application/json' \
    --header  "Grpc-Metadata-macaroon: $LOOP1_MACAROON_HEXSTR" # --verbose

# test the lnd2-loop REST API with a quote request
echo "loop2 results"
LOOP2_MACAROON_HEXSTR=$(cat dev/lnd/lnd2-loop.macaroon | xxd -p |  awk '{print}' ORS='')
# echo $LOOP2_MACAROON_HEXSTR
# test loop2 rest api
curl -k \
    --request GET \
    --url     https://localhost:8082/v1/loop/out/quote/500000 \
    --header  'Content-Type: application/json' \
    --header  "Grpc-Metadata-macaroon: $LOOP2_MACAROON_HEXSTR" # --verbose

# reload env vars
direnv reload
