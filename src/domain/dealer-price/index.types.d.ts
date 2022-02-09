type DealerPriceServiceError = import("./errors").DealerPriceServiceError

interface IDealerPriceService {
  getExchangeRateForImmediateUsdBuy(
    amountInSatoshis: Satoshis,
  ): Promise<UsdCents | DealerPriceServiceError>
  getExchangeRateForImmediateUsdBuyFromCents(
    amountInCents: UsdCents,
  ): Promise<Satoshis | DealerPriceServiceError>
  getExchangeRateForImmediateUsdSell(
    amountInCents: UsdCents,
  ): Promise<Satoshis | DealerPriceServiceError>
  getExchangeRateForImmediateUsdSellFromSatoshis(
    amountInSatoshis: Satoshis,
  ): Promise<UsdCents | DealerPriceServiceError>
  getQuoteRateForFutureUsdBuy(
    amountInSatoshis: Satoshis,
    timeToExpiryInSeconds: Seconds,
  ): Promise<UsdCents | DealerPriceServiceError>
  getQuoteRateForFutureUsdSell(
    amountInCents: UsdCents,
    timeToExpiryInSeconds: Seconds,
  ): Promise<Satoshis | DealerPriceServiceError>
}
