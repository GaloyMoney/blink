import { SATS_PER_BTC, toSats } from "@domain/bitcoin"
import { CENTS_PER_USD, toCents, toCentsPerSatsRatio } from "@domain/fiat"

// simulated price at 20k btc/usd
// or 50 sats per cents. 0.05 sat per cents
const baseRate = 20_000
const baseRatio = baseRate / 1000
const spreadImmediate = 0.04
const spreadQuote = 0.08

const buyImmediate = baseRatio + spreadImmediate
const sellUsdImmediateFromSats = baseRatio - spreadImmediate
const getBuyUsdQuoteFromSats = baseRatio + spreadQuote
const getSellUsdQuoteFromSats = baseRatio - spreadQuote

const sellUsdImmediate = baseRatio + spreadImmediate
const buyUsdImmediateFromCents = baseRatio - spreadImmediate
const getBuyUsdQuoteFromCents = baseRatio - spreadQuote
const getSellUsdQuoteFromCents = baseRatio + spreadQuote

export const DealerPriceService = (): IDealerPriceService => ({
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
  getCentsPerSatsExchangeMidRate: async (): Promise<CentsPerSatsRatio> =>
    toCentsPerSatsRatio((baseRate * CENTS_PER_USD) / SATS_PER_BTC),
})
