Swap Service (regtest)
=======================

This docs shows you how to get the swap service up and running in your local dev environment.

The high level steps are:

1. Start the loop server
2. Configure the swap params in default.yaml
3. Choose the swap provider in your code
4. Test a swap out
5. Monitor the status of a swap

Quickstart
----------
```
# 1. Start loop server
make start-loopd
# 2. Monitor loop outs
loopd1_id=$(docker ps -q -f name="loopd1-1")
docker exec -it $loopd1_id loop -n regtest monitor
# 3. Loop out
TEST="swap-out" make integration
# 4. Mine a block (or a few) to finish the loop out
make mine-block
make mine-block
```

(1) Start the loopserver (regtest LL loop server) and loopd (Rest API)
---------------------------------------
```sh
make start-loopd
```

Successfully starting the loop server returns this:
```json
{
  "swap_fee_sat":"50",
  "prepay_amt_sat":"1337",
  "htlc_sweep_fee_sat":"7262",
  "swap_payment_dest":"A31dVAIzvYn1p/0J7WG3DS7Qbq5FIzWhPgtHQngozskq",
  "cltv_delta":0,
  "conf_target":9
}
```

(2) Configure the loop params in `default.yaml`
---------------------------------------

```yaml
swap:
  loopOutWhenHotWalletLessThan: 75000000
  swapOutAmount:  50000000
  swapProviders: ["Loop"]
  lnd1loopRestEndpoint: "https://localhost:8081"
  lnd1loopRpcEndpoint: "localhost:11010"
  lnd2loopRestEndpoint: "https://localhost:8082"
  lnd2loopRpcEndpoint: "localhost:11011"
```

When testing in dev you want to override this config by creating a `/var/yaml/custom.yaml` file

create `/var/yaml/custom.yaml` and set permissions:
```
sudo touch /var/yaml/custom.yaml
sudo chmod 755 /var/yaml/custom.yaml
```

Add the following config (you might need to 'retry as sudo' on mac+vscode):
```
swap:
  loopOutWhenHotWalletLessThan: 300000
  swapOutAmount:  250000
  swapProviders: ["Loop"]
  lnd1loopRestEndpoint: "https://localhost:8081"
  lnd1loopRpcEndpoint: "localhost:11010"
  lnd2loopRestEndpoint: "https://localhost:8082"
  lnd2loopRpcEndpoint: "localhost:11011"
```

(3) Choose the swap provider
---------------------------------------

By default we use the lightning-labs `loop` swap provider, but there is an `ISwapProvider` interface that third party contributors can code against. For example, you could create a PeerSwap swap provider by configuring the `swapProviders` parameter in the `default.yaml` file. Use the lightning-labs provider as an example here `src/services/loopd`.

```typescript
import { LoopService } from "@services/loopd"
import { LND1_LOOP_CONFIG } from "./get-active-loopd"

// do swap out
const loopService = LoopService(LND1_LOOP_CONFIG)
const loopResult = await loopService.swapOut({ amount: swapOutAmount })
```

(4) Monitor Status of the swap
----------------------------
The easiest way to monitor the status of a loop out in dev is to remote into loopd.
```
# loop 1
loopd1_id=$(docker ps -q -f name="loopd1-1")
docker exec -it $loopd1_id loop -n regtest monitor
# loop 2
loopd2_id=$(docker ps -q -f name="loopd2-1")
docker exec -it $loopd2_id loop -n regtest monitor
```
This command will keep an open listener for any loop events.

Also, here is a REST call you can make to check the status of swaps
```
LOOP_MACAROON=$(cat dev/lnd/loop.macaroon | xxd -p |  awk '{print}' ORS='')
curl -k \
    --request GET \
    --url     https://localhost:8081/v1/loop/swaps \
    --cert     dev/lnd/tls.cert \
    --key      dev/lnd/tls.key \
    --header  'Content-Type: application/json' \
    --header  "Grpc-Metadata-macaroon: $LOOP_MACAROON" \
    --verbose \
    | yarn pino-pretty -c -l
```

(5) Test a Loop Out
---------------------------------------
The easiest test to run to see if the swap service is up and working is `TEST="swap-out" make integration`

But you can also run these tests:
```sh
TEST="swap-out-checker" make unit
TEST="swap-listener" make integration
TEST="swap-out" make integration
TEST="swap-record-ledger-fee" make integration
```

Event Listeners
============
There is an event listener for swaps called `listenerSwapMonitor` in the `src/servers/trigger.ts` server. It listens for swap events, like "Swap Out Success" or failure. This listener triggers a `handleSwapOutCompleted` event in the `src/app/swap/swap-listener.ts` file.

```
make start-trigger
```

In dev, you can monitoring the output of this listener in the console. You should see blocks being mined, as well as
successfully loop outs, preimage revealed messages, etc...

Cron Job
=====
There is a cron job that checks if the onChain wallet is depleted. If it is depleted, it proceeds to do a `swap out` based on the swap config from the `default.yaml` file.

To Enable

default.yaml
```
cronConfig:
  swapEnabled: true
```

```
make start-cron
```

Tracing
=======
In Honeycomb you can query for `code.namespace = services.swap`

Generate GRPC Types
====================
TODO automate via CI
```
cd src/services/loopd/protos
buf generate
```

Troubleshooting
=============
If you get the error:
```
Waiting for lnd to be fully synced to its chain backend, this might take a while
```
Then the chain is not synced. Try running `make mine-block`
