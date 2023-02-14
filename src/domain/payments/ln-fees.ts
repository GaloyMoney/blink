import { FEECAP_BASIS_POINTS } from "@domain/bitcoin"
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

  const minFeeFromPriceRatio = (priceRatio: PriceRatio) =>
    priceRatio.convertFromUsd(ONE_CENT)

  const intraLedgerFees = () => {
    return {
      btc: ZERO_SATS,
      usd: ZERO_CENTS,
    }
  }

  const feeFromRawRoute = (rawRoute: RawRoute): BtcPaymentAmount | ValidationError => {
    const amount = Math.ceil(rawRoute.safe_fee)
    return paymentAmountFromNumber({ amount, currency: WalletCurrency.Btc })
  }

  return {
    intraLedgerFees,
    maxProtocolAndBankFee,
    minFeeFromPriceRatio,
    feeFromRawRoute,
  }
}
