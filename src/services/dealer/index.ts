const spreadImmediate = 0.04
const spreadQuote = 0.08
const baseRatio = 20

// simulated price at 20k btc/usd
// or 50 sats per cents. 0.05 sat per cents

const buyImmediate = baseRatio + spreadImmediate
const buyUsdImmediateFromCents = baseRatio - spreadImmediate
const sellUsdImmediate = baseRatio + spreadImmediate
const sellUsdImmediateFromSats = baseRatio - spreadImmediate
const getBuyUsdQuoteFromCents = baseRatio - spreadQuote

export const Dealer = () => ({
  // TODO: replace with real implementation
  // + mock for test

  buyUsdImmediate: async (amount: Satoshis): Promise<UsdCents> =>
    Math.floor(Number(amount) / buyImmediate) as UsdCents,
  buyUsdImmediateFromCents: async (amount: UsdCents): Promise<Satoshis> =>
    Math.floor(Number(amount) * buyUsdImmediateFromCents) as Satoshis,
  sellUsdImmediate: async (amount: UsdCents) =>
    Math.floor(Number(amount) * sellUsdImmediate) as Satoshis,
  sellUsdImmediateFromSats: async (amount: Satoshis): Promise<UsdCents> =>
    Math.floor(Number(amount) / sellUsdImmediateFromSats) as UsdCents,

  getBuyUsdQuoteFromCents: async (amount: UsdCents): Promise<Satoshis> =>
    Math.floor(Number(amount) * getBuyUsdQuoteFromCents) as Satoshis,
})
