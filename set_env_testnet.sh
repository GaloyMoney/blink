# set firebase env
TLS=$(docker exec -i -t lnd_btc base64 /root/.lnd/tls.cert | tr -d '\n\r')
MACAROON=$(docker exec -i -t lnd_btc base64 /root/.lnd/data/chain/bitcoin/testnet/admin.macaroon | tr -d '\n\r')

firebase functions:config:set lnd.testnet.tls="$TLS" lnd.testnet.macaroon="$MACAROON"

firebase functions:config:get > .runtimeconfig.json