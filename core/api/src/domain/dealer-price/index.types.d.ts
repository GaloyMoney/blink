type DealerPriceServiceError = import("./errors").DealerPriceServiceError

interface IDealerPriceService {
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

  getCentsPerSatsExchangeMidRate(): Promise<WalletPriceRatio | ValidationError>
}
