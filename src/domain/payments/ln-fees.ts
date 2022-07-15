import { FEECAP_BASIS_POINTS } from "@domain/bitcoin"
import {
  WalletCurrency,
  ZERO_SATS,
  ZERO_CENTS,
  paymentAmountFromNumber,
  AmountCalculator,
} from "@domain/shared"

const calc = AmountCalculator()

export const LnFees = (
  {
    feeCapBasisPoints,
  }: {
    feeCapBasisPoints: bigint
  } = {
    feeCapBasisPoints: FEECAP_BASIS_POINTS,
  },
) => {
  const maxProtocolFee = <T extends WalletCurrency>(amount: PaymentAmount<T>) => {
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

  const feeFromRawRoute = (rawRoute: RawRoute): BtcPaymentAmount | ValidationError => {
    const amount = Math.ceil(rawRoute.fee)
    return paymentAmountFromNumber({ amount, currency: WalletCurrency.Btc })
  }

  return {
    intraLedgerFees,
    maxProtocolFee,
    feeFromRawRoute,
  }
}
