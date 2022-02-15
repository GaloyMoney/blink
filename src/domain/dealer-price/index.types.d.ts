type DealerPriceServiceError = import("./errors").DealerPriceServiceError

interface IDealerPriceService {
  getCentsFromSatsForImmediateBuy(
    amountInSatoshis: Satoshis,
  ): Promise<UsdCents | DealerPriceServiceError>
  getCentsFromSatsForImmediateSell(
    amountInSatoshis: Satoshis,
  ): Promise<UsdCents | DealerPriceServiceError>
  getCentsFromSatsForFutureBuy(
    amountInSatoshis: Satoshis,
    timeToExpiryInSeconds: Seconds,
  ): Promise<UsdCents | DealerPriceServiceError>
  getCentsFromSatsForFutureSell(
    amountInSatoshis: Satoshis,
    timeToExpiryInSeconds: Seconds,
  ): Promise<UsdCents | DealerPriceServiceError>

  getSatsFromCentsForImmediateBuy(
    amountInUsd: UsdCents,
  ): Promise<Satoshis | DealerPriceServiceError>
  getSatsFromCentsForImmediateSell(
    amountInUsd: UsdCents,
  ): Promise<Satoshis | DealerPriceServiceError>
  getSatsFromCentsForFutureBuy(
    amountInUsd: UsdCents,
    timeToExpiryInSeconds: Seconds,
  ): Promise<Satoshis | DealerPriceServiceError>
  getSatsFromCentsForFutureSell(
    amountInUsd: UsdCents,
    timeToExpiryInSeconds: Seconds,
  ): Promise<Satoshis | DealerPriceServiceError>
  getCentsPerBtcExchangeMidRate(): Promise<UsdCents | DealerPriceServiceError>
}
