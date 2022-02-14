import { toSats } from "@domain/bitcoin"
import { toCents } from "@domain/fiat"

const spreadImmediate = 0.04
const spreadQuote = 0.08
const baseRatio = 20

// simulated price at 20k btc/usd
// or 50 sats per cents. 0.05 sat per cents

const buyImmediate = baseRatio + spreadImmediate
const sellUsdImmediateFromSats = baseRatio - spreadImmediate
const getBuyUsdQuoteFromSats = baseRatio + spreadQuote
const getSellUsdQuoteFromSats = baseRatio - spreadQuote

const sellUsdImmediate = baseRatio + spreadImmediate
const buyUsdImmediateFromCents = baseRatio - spreadImmediate
const getBuyUsdQuoteFromCents = baseRatio - spreadQuote
const getSellUsdQuoteFromCents = baseRatio + spreadQuote

export const DealerPriceService = () => ({
  // TODO: replace with real implementation
  // + mock for test

  getCentsFromSatsForImmediateBuy: async (amount: Satoshis): Promise<UsdCents> =>
    toCents(Math.floor(Number(amount) / buyImmediate)),
  getCentsFromSatsForImmediateSell: async (amount: Satoshis): Promise<UsdCents> =>
    toCents(Math.floor(Number(amount) / sellUsdImmediateFromSats)),
  getCentsFromSatsForFutureBuy: async (
    amount: Satoshis,
    timeToExpiryInSeconds: Seconds,
  ): Promise<UsdCents> =>
    toCents(
      (Math.floor(Number(amount) * getBuyUsdQuoteFromSats) * timeToExpiryInSeconds) /
        timeToExpiryInSeconds,
    ),
  getCentsFromSatsForFutureSell: async (
    amount: Satoshis,
    timeToExpiryInSeconds: Seconds,
  ): Promise<UsdCents> =>
    toCents(
      (Math.floor(Number(amount) * getSellUsdQuoteFromSats) * timeToExpiryInSeconds) /
        timeToExpiryInSeconds,
    ),

  getSatsFromCentsForImmediateBuy: async (amount: UsdCents): Promise<Satoshis> =>
    toSats(Math.floor(Number(amount) * buyUsdImmediateFromCents)),
  getSatsFromCentsForImmediateSell: async (amount: UsdCents) =>
    toSats(Math.floor(Number(amount) * sellUsdImmediate)),
  getSatsFromCentsForFutureBuy: async (
    amount: UsdCents,
    timeToExpiryInSeconds: Seconds,
  ): Promise<Satoshis> =>
    toSats(
      (Math.floor(Number(amount) * getBuyUsdQuoteFromCents) * timeToExpiryInSeconds) /
        timeToExpiryInSeconds,
    ),
  getSatsFromCentsForFutureSell: async (
    amount: UsdCents,
    timeToExpiryInSeconds: Seconds,
  ): Promise<Satoshis> =>
    toSats(
      (Math.floor(Number(amount) * getSellUsdQuoteFromCents) * timeToExpiryInSeconds) /
        timeToExpiryInSeconds,
    ),
})
