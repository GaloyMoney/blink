import { AmountCalculator, ZERO_SATS } from "@domain/shared"

const calc = AmountCalculator()

export const DepositFeeCalculator = (): DepositFeeCalculator => {
  const onChainDepositFee = ({
    amount,
    minBankFee,
    minBankFeeThreshold,
    dustThreshold,
    ratio,
  }: OnChainDepositFeeArgs): BtcPaymentAmount | ValidationError => {
    const fee = calc.max(minBankFee, dustThreshold)
    if (amount.amount < minBankFeeThreshold.amount)
      return fee.amount > amount.amount ? amount : fee
    if (ratio === 0n) return ZERO_SATS
    return calc.mulBasisPoints(amount, ratio)
  }

  return {
    onChainDepositFee,
    lnDepositFee: () => ZERO_SATS, // TODO: implement
  }
}
