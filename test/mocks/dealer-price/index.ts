import { SATS_PER_BTC, toSats } from "@domain/bitcoin"
import { defaultTimeToExpiryInSeconds } from "@domain/bitcoin/lightning"
import { CENTS_PER_USD, toCents, toCentsPerSatsRatio } from "@domain/fiat"
import { toPriceRatio } from "@domain/payments"
import { paymentAmountFromNumber, WalletCurrency } from "@domain/shared"

// simulated price at 20k usd/btc
// or 50 sats per cents. 0.02 sat per cents
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
  ): Promise<UsdPaymentAmount | DealerPriceServiceError> => {
    const amountForPayment = Math.floor(Number(amount.amount) / buyImmediate)

    return paymentAmountFromNumber({
      amount: amountForPayment,
      currency: WalletCurrency.Usd,
    })
  },
  getCentsFromSatsForImmediateSell: async (
    amount: BtcPaymentAmount,
  ): Promise<UsdPaymentAmount | DealerPriceServiceError> => {
    const amountForPayment = Math.floor(Number(amount.amount) / sellUsdImmediateFromSats)

    return paymentAmountFromNumber({
      amount: amountForPayment,
      currency: WalletCurrency.Usd,
    })
  },
  getCentsFromSatsForFutureBuy: async (
    amount: BtcPaymentAmount,
  ): Promise<UsdPaymentAmount | DealerPriceServiceError> => {
    const amountForPayment =
      (Math.floor(Number(amount.amount) * getBuyUsdQuoteFromSats) *
        timeToExpiryInSeconds) /
      timeToExpiryInSeconds

    return paymentAmountFromNumber({
      amount: amountForPayment,
      currency: WalletCurrency.Usd,
    })
  },
  getCentsFromSatsForFutureSell: async (
    amount: BtcPaymentAmount,
  ): Promise<UsdPaymentAmount | DealerPriceServiceError> => {
    const amountForPayment =
      (Math.floor(Number(amount.amount) * getSellUsdQuoteFromSats) *
        timeToExpiryInSeconds) /
      timeToExpiryInSeconds

    return paymentAmountFromNumber({
      amount: amountForPayment,
      currency: WalletCurrency.Usd,
    })
  },

  getSatsFromCentsForImmediateBuy: async (
    amount: UsdPaymentAmount,
  ): Promise<BtcPaymentAmount | DealerPriceServiceError> => {
    const amountForPayment = Math.floor(Number(amount.amount) * buyUsdImmediateFromCents)

    return paymentAmountFromNumber({
      amount: amountForPayment,
      currency: WalletCurrency.Btc,
    })
  },
  getSatsFromCentsForImmediateSell: async (
    amount: UsdPaymentAmount,
  ): Promise<BtcPaymentAmount | DealerPriceServiceError> => {
    const amountForPayment = Math.floor(Number(amount.amount) * sellUsdImmediate)

    return paymentAmountFromNumber({
      amount: amountForPayment,
      currency: WalletCurrency.Btc,
    })
  },
  getSatsFromCentsForFutureBuy: async (
    amount: UsdPaymentAmount,
  ): Promise<BtcPaymentAmount | DealerPriceServiceError> => {
    const amountForPayment =
      (Math.floor(Number(amount.amount) * getBuyUsdQuoteFromCents) *
        timeToExpiryInSeconds) /
      timeToExpiryInSeconds

    return paymentAmountFromNumber({
      amount: amountForPayment,
      currency: WalletCurrency.Btc,
    })
  },
  getSatsFromCentsForFutureSell: async (
    amount: UsdPaymentAmount,
  ): Promise<BtcPaymentAmount | DealerPriceServiceError> => {
    const amountForPayment =
      (Math.floor(Number(amount.amount) * getSellUsdQuoteFromCents) *
        timeToExpiryInSeconds) /
      timeToExpiryInSeconds

    return paymentAmountFromNumber({
      amount: amountForPayment,
      currency: WalletCurrency.Btc,
    })
  },
  getCentsPerSatsExchangeMidRate: async (): Promise<PriceRatio | ValidationError> =>
    toPriceRatio((baseRate * CENTS_PER_USD) / SATS_PER_BTC),
})
