import { FeeDifferenceError } from "./errors"

import { WalletCurrency } from "@/domain/shared"

export const FeeReimbursement = ({
  prepaidFeeAmount,
  priceRatio,
}: {
  prepaidFeeAmount: {
    btc: BtcPaymentAmount
    usd: UsdPaymentAmount
  }
  priceRatio: WalletPriceRatio
}): FeeReimbursement => {
  const getReimbursement = (
    actualFee: BtcPaymentAmount,
  ): PaymentAmountInAllCurrencies | FeeDifferenceError => {
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
