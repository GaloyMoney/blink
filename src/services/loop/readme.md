Loop 
====

1. Start the loopserver (Mock Swap Server) and loopclient (Rest API)
```sh
make start-loop
```

2. Configure the loop params in `default.yaml`

```yaml
loop:
  maxOutboundLiquidityBalance: 2835916 # 0.03 ($600)
  loopUrl: "https://localhost:8081"
  loopoutAmount: 945305 # 0.009 ($200)
  loopProvider: "@services/loop/providers/lightning-labs/loop-swap-provider" # or another custom provider, like Boltz
```

3. Choose the swap provider

By default we use the lightning-labs `loop` swap provider, but there is an `ISwapProvider` interface that third party contributors can code against. For example, they could create a Boltz swap provider by configuring the `loopProvider` parameter in the `default.yaml` file, then following the lightning-labs provider as an example here `src/services/loop/providers/lightning-labs`. 

The `src/loop/loop-service.ts` uses a dynamic import to inject in the configured provider like this:

```typescript
const SWAP_PROVIDER = "@services/loop/providers/lightning-labs/loop-swap-provider"
const swapProvider: ISwapProvider = await (await import(`${SWAP_PROVIDER}`)).default
```
 The SWAP_PROVIDER can point to a custom provider.

3. Unit test a Loop Out
```sh
TEST=loop-service make unit
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