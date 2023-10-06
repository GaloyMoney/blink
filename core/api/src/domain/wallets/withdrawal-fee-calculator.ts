import { AmountCalculator, ZERO_CENTS, ZERO_SATS } from "@/domain/shared"

const calc = AmountCalculator()

export const OnChainFees = ({
  thresholdImbalance,
  feeRatioAsBasisPoints,
}: OnchainWithdrawalConfig): OnChainFeeCalculator => {
  const withdrawalFee = ({
    minerFee,
    amount,
    minBankFee,
    imbalance,
  }: {
    minerFee: BtcPaymentAmount
    amount: BtcPaymentAmount
    minBankFee: BtcPaymentAmount
    imbalance: BtcPaymentAmount
  }) => {
    const amountWithImbalanceCalcs = {
      amount: imbalance.amount - thresholdImbalance.amount + amount.amount,
      currency: amount.currency,
    }
    const baseAmount = calc.max(calc.min(amountWithImbalanceCalcs, amount), ZERO_SATS)
    const bankFee = calc.max(
      minBankFee,
      calc.mulBasisPoints(baseAmount, feeRatioAsBasisPoints),
    )

    return {
      totalFee: calc.add(bankFee, minerFee),
      bankFee,
    }
  }

  return {
    withdrawalFee,
    intraLedgerFees: () => ({
      btc: ZERO_SATS,
      usd: ZERO_CENTS,
    }),
  }
}
