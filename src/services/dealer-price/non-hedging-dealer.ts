import { toSats } from "@domain/bitcoin"
import { CacheKeys } from "@domain/cache"
import { toCents } from "@domain/fiat"
import { PriceNotAvailableError } from "@domain/price"
import { WalletCurrency } from "@domain/shared"
import { LocalCacheService } from "@services/cache"
import { PriceService } from "@services/price"

export const DealerPriceService = (): IDealerPriceService => {
  const getPrice = async (): Promise<CentsPerSatsRatio | PriceServiceError> => {
    const realtimePrice = await PriceService().getRealTimePrice()
    if (realtimePrice instanceof Error) {
      const cachedPrice = await getCachedPrice()
      if (cachedPrice instanceof Error) return cachedPrice
      return cachedPrice as unknown as CentsPerSatsRatio
    }
    return realtimePrice as unknown as CentsPerSatsRatio
  }

  const getCentsFromSats = async (
    amountInSatoshis: Satoshis,
  ): Promise<UsdCents | DealerPriceServiceError> => {
    const realtimePrice = await getPrice()
    if (realtimePrice instanceof Error) return realtimePrice

    return toCents(Math.round(amountInSatoshis * realtimePrice))
  }

  const getSatsFromCents = async function (
    amountInUsd: UsdCents,
  ): Promise<Satoshis | DealerPriceServiceError> {
    const realtimePrice = await getPrice()
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

    getCentsPerSatsExchangeMidRate: getPrice,
  }
}

export const NewDealerPriceService = (): INewDealerPriceService => {
  const getPrice = async (): Promise<CentsPerSatsRatio | PriceServiceError> => {
    const realtimePrice = await PriceService().getRealTimePrice()
    if (realtimePrice instanceof Error) {
      const cachedPrice = await getCachedPrice()
      if (cachedPrice instanceof Error) return cachedPrice
      return cachedPrice as unknown as CentsPerSatsRatio
    }
    return realtimePrice as unknown as CentsPerSatsRatio
  }

  const getCentsFromSats = async (
    btcAmount: BtcPaymentAmount,
  ): Promise<UsdPaymentAmount | DealerPriceServiceError> => {
    const realtimePrice = await getPrice()
    if (realtimePrice instanceof Error) return realtimePrice

    return {
      amount: BigInt(Math.round(Number(btcAmount.amount) * realtimePrice)),
      currency: WalletCurrency.Usd,
    }
  }

  const getSatsFromCents = async function (
    usdAmount: UsdPaymentAmount,
  ): Promise<BtcPaymentAmount | DealerPriceServiceError> {
    const realtimePrice = await getPrice()
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

    getCentsPerSatsExchangeMidRate: getPrice,
  }
}

const getCachedPrice = async (): Promise<
  DisplayCurrencyPerSat | PriceNotAvailableError
> => {
  const cachedPrice = await LocalCacheService().get<DisplayCurrencyPerSat>(
    CacheKeys.CurrentPrice,
  )
  if (cachedPrice instanceof Error) return new PriceNotAvailableError()
  return cachedPrice
}
