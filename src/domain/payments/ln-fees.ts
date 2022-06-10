import {
  WalletCurrency,
  ZERO_SATS,
  ZERO_CENTS,
  paymentAmountFromNumber,
  AmountCalculator,
} from "@domain/shared"

export const FEECAP_PERCENT = 2n

const calc = AmountCalculator()

export const LnFees = (
  {
    feeCapPercent,
  }: {
    feeCapPercent: bigint
  } = {
    feeCapPercent: FEECAP_PERCENT,
  },
) => {
  const maxProtocolFee = <T extends WalletCurrency>(amount: PaymentAmount<T>) => {
    if (amount.amount == 0n) {
      return amount
    }

    const maxFee = calc.divRound(
      { amount: amount.amount * feeCapPercent, currency: amount.currency },
      100n,
    )

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
