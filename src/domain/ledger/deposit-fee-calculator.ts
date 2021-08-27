import { toSats } from "@domain/bitcoin"

export const DepositFeeCalculator = (amount: Satoshis): DepositFeeCalculator => {
  const onChainDepositFee = (ratio: DepositFeeRatio) => {
    return toSats(Math.round(amount * ratio))
  }

  return {
    onChainDepositFee,
    lnDepositFee: () => toSats(0),
  }
}
