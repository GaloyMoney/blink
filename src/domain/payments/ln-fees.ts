import { FEECAP_BASIS_POINTS } from "@domain/bitcoin"
import { MaxFeeTooLargeForRoutelessPaymentError } from "@domain/bitcoin/lightning"
import {
  WalletCurrency,
  ZERO_SATS,
  ZERO_CENTS,
  paymentAmountFromNumber,
  AmountCalculator,
  ONE_CENT,
} from "@domain/shared"

const calc = AmountCalculator()

export const LnFees = () => {
  const feeCapBasisPoints = FEECAP_BASIS_POINTS

  const maxProtocolAndBankFee = <T extends WalletCurrency>(amount: PaymentAmount<T>) => {
    if (amount.amount == 0n) {
      return amount
    }

    const maxFee = calc.mulBasisPoints(amount, feeCapBasisPoints)

    return {
      amount: maxFee.amount === 0n ? 1n : maxFee.amount,
      currency: amount.currency,
    }
  }

  const intraLedgerFees = () => {
    return {
      btc: ZERO_SATS,
      usd: ZERO_CENTS,
    }
  }

  const verifyMaxFee = ({
    maxFeeToVerify,
    btcPaymentAmount,
    priceRatio,
    senderWalletCurrency,
  }: {
    maxFeeToVerify: BtcPaymentAmount
    btcPaymentAmount: BtcPaymentAmount
    priceRatio: PriceRatio
    senderWalletCurrency: WalletCurrency
  }) => {
    const maxFeeAmount = maxProtocolAndBankFee(btcPaymentAmount)
    const minFeeAmount = priceRatio.convertFromUsd(ONE_CENT)
    console.log("HERE 0:", {
      maxFeeToVerify,
      maxFeeAmount,
      minFeeAmount,
      senderWalletCurrency,
    })
    if (
      (senderWalletCurrency === WalletCurrency.Btc ||
        maxFeeToVerify.amount > minFeeAmount.amount) &&
      maxFeeToVerify.amount > maxFeeAmount.amount
    ) {
      return new MaxFeeTooLargeForRoutelessPaymentError()
    }

    return true
  }

  const feeFromRawRoute = (rawRoute: RawRoute): BtcPaymentAmount | ValidationError => {
    const amount = Math.ceil(rawRoute.safe_fee)
    return paymentAmountFromNumber({ amount, currency: WalletCurrency.Btc })
  }

  return {
    intraLedgerFees,
    maxProtocolAndBankFee,
    verifyMaxFee,
    feeFromRawRoute,
  }
}
