type DealerPriceServiceError = import("./errors").DealerPriceServiceError

interface IDealerPriceService {
  getExchangeRateForImmediateUsdBuy(
    amountInSatoshis: Satoshis,
  ): Promise<UsdCents | DealerPriceServiceError>
  getExchangeRateForImmediateUsdSell(
    amountInUsd: UsdCents,
  ): Promise<Satoshis | DealerPriceServiceError>
  getExchangeRateForFutureUsdBuy(
    amountInSatoshis: Satoshis,
    timeToExpiryInMinutes: Minutes,
  ): Promise<UsdCents | DealerPriceServiceError>
  getExchangeRateForFutureUsdSell(
    amountInUsd: UsdCents,
    timeToExpiryInMinutes: Minutes,
  ): Promise<Satoshis | DealerPriceServiceError>
}
