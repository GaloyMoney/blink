import { WalletCurrency } from "@domain/shared"

import { FeeDifferenceError } from "./errors"

export const FeeReimbursement = ({
  prepaidFeeAmount,
  priceRatio,
}: {
  prepaidFeeAmount: {
    btc: BtcPaymentAmount
    usd: UsdPaymentAmount
  }
  priceRatio: PriceRatio
}): FeeReimbursement => {
  const getReimbursement = (
    actualFee: BtcPaymentAmount,
  ): { btc: BtcPaymentAmount; usd: UsdPaymentAmount } | FeeDifferenceError => {
    const feeDifferenceBtc = prepaidFeeAmount.btc.amount - actualFee.amount
    if (feeDifferenceBtc < 0) return new FeeDifferenceError()
    const feeDifferenceBtcAmount = {
      amount: feeDifferenceBtc,
      currency: WalletCurrency.Btc,
    }

    const feeDifferenceUsdAmount =
      actualFee.amount === 0n
        ? priceRatio.convertFromBtc(feeDifferenceBtcAmount)
        : priceRatio.convertFromBtcToFloor(feeDifferenceBtcAmount)

    return { btc: feeDifferenceBtcAmount, usd: feeDifferenceUsdAmount }
  }

  return {
    getReimbursement,
  }
}
