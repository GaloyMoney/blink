import { toSats } from "@domain/bitcoin"

export const DepositFeeCalculator = (): DepositFeeCalculator => {
  const onChainDepositFee = ({ amount, ratio }: onChainDepositFeeArgs) => {
    return toSats(Math.round(amount * ratio))
  }

  return {
    onChainDepositFee,
    lnDepositFee: () => toSats(0), // TODO: implement
  }
}
