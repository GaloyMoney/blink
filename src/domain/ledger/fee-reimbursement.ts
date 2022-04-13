import { toSats } from "@domain/bitcoin"
import { PriceRatio } from "@domain/payments"
import { WalletCurrency } from "@domain/shared"

import { FeeDifferenceError } from "./errors"

export const FeeReimbursement = (prepaidFee: Satoshis): FeeReimbursement => {
  const getReimbursement = (actualFee: Satoshis): Satoshis | FeeDifferenceError => {
    const feeDifference = toSats(prepaidFee - actualFee)
    if (feeDifference < 0) return new FeeDifferenceError()
    return feeDifference
  }

  return {
    getReimbursement,
  }
}

export const NewFeeReimbursement = (prepaidFeeAmount: {
  btc: BtcPaymentAmount
  usd: UsdPaymentAmount
}): NewFeeReimbursement => {
  const getReimbursement = (
    actualFee: BtcPaymentAmount,
  ): { btc: BtcPaymentAmount; usd: UsdPaymentAmount } | FeeDifferenceError => {
    const feeDifferenceBtc = prepaidFeeAmount.btc.amount - actualFee.amount
    if (feeDifferenceBtc < 0) return new FeeDifferenceError()
    const feeDifferenceBtcAmount = {
      amount: feeDifferenceBtc,
      currency: WalletCurrency.Btc,
    }

    const priceRatio = PriceRatio(prepaidFeeAmount)
    if (priceRatio instanceof Error) return new FeeDifferenceError()

    const feeDifferenceUsdAmount = priceRatio.convertFromBtc(feeDifferenceBtcAmount)

    return { btc: feeDifferenceBtcAmount, usd: feeDifferenceUsdAmount }
  }

  return {
    getReimbursement,
  }
}
