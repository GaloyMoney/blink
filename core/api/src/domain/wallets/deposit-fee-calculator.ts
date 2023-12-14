import { AmountCalculator, ZERO_SATS } from "@/domain/shared"

const calc = AmountCalculator()

export const DepositFeeCalculator = (): DepositFeeCalculator => {
  const onChainDepositFee = ({
    amount,
    minBankFee,
    minBankFeeThreshold,
    ratio,
  }: OnChainDepositFeeArgs): BtcPaymentAmount | ValidationError => {
    if (amount.amount < minBankFeeThreshold.amount) return minBankFee
    if (ratio === 0n) return ZERO_SATS
    return calc.mulBasisPoints(amount, ratio)
  }

  return {
    onChainDepositFee,
    lnDepositFee: () => ZERO_SATS, // TODO: implement
  }
}
