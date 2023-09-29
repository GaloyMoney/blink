#!/bin/sh

# reload env vars
direnv reload

# stop existing docker
docker compose stop loopserver
docker compose stop loopd1
docker compose stop loopd2

# boot up the mock loopserver
docker compose up loopserver -d

# add more sats to LNDs for loopouts, need at least 250,000
outside=$(docker ps -q -f name="lnd-outside-1-1")
lnd1=$(docker ps -q -f name="lnd1-1")
addr1=$(docker exec $lnd1 lncli -n regtest newaddress p2wkh | grep address | awk -F'"' '{print $4}')
docker exec $outside lncli -n regtest sendcoins $addr1 500000

# mine some bitcoin to sync the loopserver
make mine-block

# start the loop client with REST API
export LOOP_SERVER_INTERNAL_IP=$(docker inspect $(docker ps -q -f name="loopserver")  -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}')
echo "LOOP_SERVER_INTERNAL_IP is $LOOP_SERVER_INTERNAL_IP"
docker compose up loopd1 -d
docker compose up loopd2 -d

echo ""
echo "waiting 5 seconds..."
echo ""
sleep 5

# test the lnd1-loop REST API with a quote request
echo "loop1 results"
LOOP1_MACAROON_HEXSTR=$(cat dev/lnd/loop/$NETWORK/loopd1-1.loop.macaroon | xxd -p |  awk '{print}' ORS='')
# echo $LOOP1_MACAROON_HEXSTR
# test loop rest api
curl -k \
    --request GET \
    --url     https://localhost:8081/v1/loop/out/quote/500000 \
    --header  'Content-Type: application/json' \
    --header  "Grpc-Metadata-macaroon: $LOOP1_MACAROON_HEXSTR" # --verbose

# test the lnd2-loop REST API with a quote request
echo "loop2 results"
LOOP2_MACAROON_HEXSTR=$(cat dev/lnd/loop/$NETWORK/loopd2-1.loop.macaroon | xxd -p |  awk '{print}' ORS='')
# echo $LOOP2_MACAROON_HEXSTR
# test loop2 rest api
curl -k \
    --request GET \
    --url     https://localhost:8082/v1/loop/out/quote/500000 \
    --header  'Content-Type: application/json' \
    --header  "Grpc-Metadata-macaroon: $LOOP2_MACAROON_HEXSTR" # --verbose
