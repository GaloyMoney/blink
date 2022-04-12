import { WalletCurrency, ZERO_SATS, ZERO_CENTS } from "@domain/shared"

export const FEECAP_PERCENT = 2n

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
    return {
      // Adding 1n to effect a rounding up of the fee
      amount: ((amount.amount + 1n) * feeCapPercent) / 100n,
      currency: amount.currency,
    }
  }

  const intraLedgerFees = () => {
    return {
      btc: ZERO_SATS,
      usd: ZERO_CENTS,
    }
  }

  const feeFromRawRoute = (rawRoute: RawRoute) => {
    return {
      amount: BigInt(Math.ceil(rawRoute.fee)),
      currency: WalletCurrency.Btc,
    }
  }

  return {
    intraLedgerFees,
    maxProtocolFee,
    feeFromRawRoute,
  }
}
