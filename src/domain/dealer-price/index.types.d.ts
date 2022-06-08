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
  getCentsPerSatsExchangeMidRate(): Promise<CentsPerSatsRatio | DealerPriceServiceError>
}

interface INewDealerPriceService {
  getCentsFromSatsForImmediateBuy(
    amount: BtcPaymentAmount,
  ): Promise<UsdPaymentAmount | DealerPriceServiceError>
  getCentsFromSatsForImmediateSell(
    amount: BtcPaymentAmount,
  ): Promise<UsdPaymentAmount | DealerPriceServiceError>
  getCentsFromSatsForFutureBuy(
    amount: BtcPaymentAmount,
  ): Promise<UsdPaymentAmount | DealerPriceServiceError>
  getCentsFromSatsForFutureSell(
    amount: BtcPaymentAmount,
  ): Promise<UsdPaymentAmount | DealerPriceServiceError>

  getSatsFromCentsForImmediateBuy(
    amount: UsdPaymentAmount,
  ): Promise<BtcPaymentAmount | DealerPriceServiceError>
  getSatsFromCentsForImmediateSell(
    amount: UsdPaymentAmount,
  ): Promise<BtcPaymentAmount | DealerPriceServiceError>
  getSatsFromCentsForFutureBuy(
    amount: UsdPaymentAmount,
  ): Promise<BtcPaymentAmount | DealerPriceServiceError>
  getSatsFromCentsForFutureSell(
    amount: UsdPaymentAmount,
  ): Promise<BtcPaymentAmount | DealerPriceServiceError>

  getCentsPerSatsExchangeMidRate(): Promise<PriceRatio | ValidationError>
}
