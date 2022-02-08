type DealerPriceServiceError = import("./errors").DealerPriceServiceError

interface IDealerPriceService {
  getExchangeRateForImmediateUsdBuy(
    amountInSatoshis: Satoshis,
  ): Promise<UsdCents | DealerPriceServiceError>
  getExchangeRateForImmediateUsdBuyFromCents(
    amountInUsd: UsdCents,
  ): Promise<Satoshis | DealerPriceServiceError>
  getExchangeRateForImmediateUsdSell(
    amountInUsd: UsdCents,
  ): Promise<Satoshis | DealerPriceServiceError>
  getExchangeRateForImmediateUsdSellFromSatoshis(
    amountInSatoshis: Satoshis,
  ): Promise<UsdCents | DealerPriceServiceError>
  getQuoteRateForFutureUsdBuy(
    amountInSatoshis: Satoshis,
    timeToExpiryInSeconds: Seconds,
  ): Promise<UsdCents | DealerPriceServiceError>
  getQuoteRateForFutureUsdSell(
    amountInUsd: UsdCents,
    timeToExpiryInSeconds: Seconds,
  ): Promise<Satoshis | DealerPriceServiceError>
}
