import { toSats } from "@domain/bitcoin"
import { checkedToBtcPaymentAmount } from "@domain/payments"
import { ZERO_SATS } from "@domain/shared"

export const DepositFeeCalculator = (): DepositFeeCalculator => {
  const onChainDepositFee = ({ amount, ratio }: onChainDepositFeeArgs) => {
    return toSats(Math.round(amount * ratio))
  }

  return {
    onChainDepositFee,
    lnDepositFee: () => toSats(0), // TODO: implement
  }
}

export const NewDepositFeeCalculator = (): NewDepositFeeCalculator => {
  const onChainDepositFee = ({ amount, ratio }: newOnChainDepositFeeArgs) => {
    return ratio === 0
      ? ZERO_SATS
      : checkedToBtcPaymentAmount(Math.round(Number(amount.amount) * ratio))
  }

  return {
    onChainDepositFee,
    lnDepositFee: () => ZERO_SATS, // TODO: implement
  }
}
