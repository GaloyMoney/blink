import { AmountCalculator, ZERO_SATS } from "@domain/shared"

const calc = AmountCalculator()

export const DepositFeeCalculator = (): DepositFeeCalculator => {
  const onChainDepositFee = ({ amount, ratio }: OnChainDepositFeeArgs) => {
    if (ratio === 0n) return ZERO_SATS

    return calc.mulBasisPoints(amount, ratio)
  }

  return {
    onChainDepositFee,
    lnDepositFee: () => ZERO_SATS, // TODO: implement
  }
}
