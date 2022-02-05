import { toSats } from "@domain/bitcoin"

export const DepositFeeCalculator = (): DepositFeeCalculator => {
  const onChainDepositFee = ({ amount, ratio }: onChainDepositFeeArgs) => {
    return toSats(BigInt(Math.ceil(Number(amount) * ratio)))
  }

  return {
    onChainDepositFee,
    lnDepositFee: () => toSats(0n), // TODO: implement
  }
}
