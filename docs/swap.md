Swap Service (regtest)
============

(1) Start the loopserver (regtest LL loop server) and loopd (Rest API)
---------------------------------------
```sh
make start-loop
```

A successful loop server start returns this
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
  minOutboundLiquidityBalance: 2000000
  loopRestEndpoint: "https://localhost:8081"
  loopRpcEndpoint: "localhost:11010"
  swapOutAmount: 500000 
  swapProviders: ["LOOP"] 
```

(3) Choose the swap provider
---------------------------------------

By default we use the lightning-labs `loop` swap provider, but there is an `ISwapProvider` interface that third party contributors can code against. For example, you could create a PeerSwap swap provider by configuring the `swapProviders` parameter in the `default.yaml` file. Use the lightning-labs provider as an example here `src/services/swap/providers/lightning-labs`. 

```typescript
import { LoopService } from "./providers/lightning-labs/loop-service"

// do swap out
const resp = await LoopService().swapOut(amount)
```


(4) Test a Loop Out
---------------------------------------
```sh
TEST="swap-out-checker" make unit
TEST="swap-listener" make integration
TEST="swap-out" make integration
```

(5) Monitor Status of the swap
----------------------------
TODO rest call

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

Event Listeners
============
There is an event listeners for swaps called `listenerSwapMonitor` in the `src/servers/trigger.ts` server. It listens for swap events, like "Swap Out Success" or failure. This listerner triggers a `handleSwapOutCompleted` event in the `src/app/swap/swap-listener.ts` file

```
make start-trigger
```


Cron Job
=====
There is a cron job that checks if the onChain wallet is depleted. If it is depleted, it proceeds to do a `swap out` based on the swap config from the `default.yaml` file.  

```
make start-cron
```

Generate GRPC Types
====================
TODO automate via CI
```
cd src/services/swap/providers/lightning-labs/protos
buf generate
```

Troubleshooting
=============
If you get the error
```
Waiting for lnd to be fully synced to its chain backend, this might take a while
```
Then the chain is not synced. Try running `make mine`