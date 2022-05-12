import { SATS_PER_BTC, toSats } from "@domain/bitcoin"
import { defaultTimeToExpiryInSeconds } from "@domain/bitcoin/lightning"
import { CENTS_PER_USD, toCents, toCentsPerSatsRatio } from "@domain/fiat"
import { paymentAmountFromCents, paymentAmountFromSats } from "@domain/shared"

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

export const NewDealerPriceService = (
  timeToExpiryInSeconds: Seconds = defaultTimeToExpiryInSeconds,
): INewDealerPriceService => ({
  getCentsFromSatsForImmediateBuy: async (
    amount: BtcPaymentAmount,
  ): Promise<UsdPaymentAmount | DealerPriceServiceError> =>
    paymentAmountFromCents(toCents(Math.floor(Number(amount.amount) / buyImmediate))),
  getCentsFromSatsForImmediateSell: async (
    amount: BtcPaymentAmount,
  ): Promise<UsdPaymentAmount | DealerPriceServiceError> =>
    paymentAmountFromCents(
      toCents(Math.floor(Number(amount.amount) / sellUsdImmediateFromSats)),
    ),
  getCentsFromSatsForFutureBuy: async (
    amount: BtcPaymentAmount,
  ): Promise<UsdPaymentAmount | DealerPriceServiceError> =>
    paymentAmountFromCents(
      toCents(
        (Math.floor(Number(amount.amount) * getBuyUsdQuoteFromSats) *
          timeToExpiryInSeconds) /
          timeToExpiryInSeconds,
      ),
    ),
  getCentsFromSatsForFutureSell: async (
    amount: BtcPaymentAmount,
  ): Promise<UsdPaymentAmount | DealerPriceServiceError> =>
    paymentAmountFromCents(
      toCents(
        (Math.floor(Number(amount.amount) * getSellUsdQuoteFromSats) *
          timeToExpiryInSeconds) /
          timeToExpiryInSeconds,
      ),
    ),

  getSatsFromCentsForImmediateBuy: async (
    amount: UsdPaymentAmount,
  ): Promise<BtcPaymentAmount | DealerPriceServiceError> =>
    paymentAmountFromSats(
      toSats(Math.floor(Number(amount.amount) * buyUsdImmediateFromCents)),
    ),
  getSatsFromCentsForImmediateSell: async (
    amount: UsdPaymentAmount,
  ): Promise<BtcPaymentAmount | DealerPriceServiceError> =>
    paymentAmountFromSats(toSats(Math.floor(Number(amount.amount) * sellUsdImmediate))),
  getSatsFromCentsForFutureBuy: async (
    amount: UsdPaymentAmount,
  ): Promise<BtcPaymentAmount | DealerPriceServiceError> =>
    paymentAmountFromSats(
      toSats(
        (Math.floor(Number(amount.amount) * getBuyUsdQuoteFromCents) *
          timeToExpiryInSeconds) /
          timeToExpiryInSeconds,
      ),
    ),
  getSatsFromCentsForFutureSell: async (
    amount: UsdPaymentAmount,
  ): Promise<BtcPaymentAmount | DealerPriceServiceError> =>
    paymentAmountFromSats(
      toSats(
        (Math.floor(Number(amount.amount) * getSellUsdQuoteFromCents) *
          timeToExpiryInSeconds) /
          timeToExpiryInSeconds,
      ),
    ),
  getCentsPerSatsExchangeMidRate: async (): Promise<CentsPerSatsRatio> =>
    toCentsPerSatsRatio((baseRate * CENTS_PER_USD) / SATS_PER_BTC),
})
