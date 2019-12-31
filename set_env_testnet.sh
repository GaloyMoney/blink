# set firebase env
TLS=$(docker exec -t lnd_btc base64 /root/.lnd/tls.cert | tr -d '\n\r')
MACAROON=$(docker exec -t lnd_btc base64 /root/.lnd/data/chain/bitcoin/testnet/admin.macaroon | tr -d '\n\r')
LNDADDR="set_ip_address"

firebase functions:config:set lnd.testnet.TLS="$TLS" lnd.testnet.MACAROON="$MACAROON" lnd.testnet.LNDADDR="$LNDADDR"