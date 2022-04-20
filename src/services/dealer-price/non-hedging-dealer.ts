import { toSats } from "@domain/bitcoin"
import { DealerPriceServiceError } from "@domain/dealer-price"
import { toCents } from "@domain/fiat"
import { WalletCurrency } from "@domain/shared"

import { getCurrentPrice } from "./non-hedging-price-helpers"

export const DealerPriceService = (): IDealerPriceService => {
  const getCentsFromSats = async (
    amountInSatoshis: Satoshis,
  ): Promise<UsdCents | DealerPriceServiceError> => {
    const realtimePrice = await getCurrentPrice()
    if (realtimePrice instanceof Error) return realtimePrice

    return toCents(Math.round(amountInSatoshis * realtimePrice))
  }

  const getSatsFromCents = async function (
    amountInUsd: UsdCents,
  ): Promise<Satoshis | DealerPriceServiceError> {
    const realtimePrice = await getCurrentPrice()
    if (realtimePrice instanceof Error) return realtimePrice

    return toSats(Math.round(Number(amountInUsd) / realtimePrice))
  }

  return {
    getCentsFromSatsForImmediateBuy: getCentsFromSats,
    getCentsFromSatsForImmediateSell: getCentsFromSats,

    getCentsFromSatsForFutureBuy: getCentsFromSats,
    getCentsFromSatsForFutureSell: getCentsFromSats,

    getSatsFromCentsForImmediateBuy: getSatsFromCents,
    getSatsFromCentsForImmediateSell: getSatsFromCents,

    getSatsFromCentsForFutureBuy: getSatsFromCents,
    getSatsFromCentsForFutureSell: getSatsFromCents,

    getCentsPerSatsExchangeMidRate: getCurrentPrice,
  }
}

export const NewDealerPriceService = (): INewDealerPriceService => {
  const getCentsFromSats = async (
    btcAmount: BtcPaymentAmount,
  ): Promise<UsdPaymentAmount | DealerPriceServiceError> => {
    const realtimePrice = await getCurrentPrice()
    if (realtimePrice instanceof Error) return realtimePrice

    return {
      amount: BigInt(Math.round(Number(btcAmount.amount) * realtimePrice)),
      currency: WalletCurrency.Usd,
    }
  }

  const getSatsFromCents = async function (
    usdAmount: UsdPaymentAmount,
  ): Promise<BtcPaymentAmount | DealerPriceServiceError> {
    const realtimePrice = await getCurrentPrice()
    if (realtimePrice instanceof Error) return realtimePrice

    return {
      amount: BigInt(Math.round(Number(usdAmount.amount) / realtimePrice)),
      currency: WalletCurrency.Btc,
    }
  }

  return {
    getCentsFromSatsForImmediateBuy: getCentsFromSats,
    getCentsFromSatsForImmediateSell: getCentsFromSats,

    getCentsFromSatsForFutureBuy: getCentsFromSats,
    getCentsFromSatsForFutureSell: getCentsFromSats,

    getSatsFromCentsForImmediateBuy: getSatsFromCents,
    getSatsFromCentsForImmediateSell: getSatsFromCents,

    getSatsFromCentsForFutureBuy: getSatsFromCents,
    getSatsFromCentsForFutureSell: getSatsFromCents,

    getCentsPerSatsExchangeMidRate: getCurrentPrice,
  }
}
