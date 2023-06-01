import { checkedToBtcPaymentAmount } from "@domain/payments"
import { ZERO_SATS } from "@domain/shared"

export const DepositFeeCalculator = (): DepositFeeCalculator => {
  const onChainDepositFee = ({ amount, ratio }: onChainDepositFeeArgs) => {
    return ratio === 0
      ? ZERO_SATS
      : checkedToBtcPaymentAmount(Math.round(Number(amount.amount) * ratio))
  }

  return {
    onChainDepositFee,
    lnDepositFee: () => ZERO_SATS, // TODO: implement
  }
}
