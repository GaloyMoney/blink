import { checkedToBtcPaymentAmount } from "@domain/shared"

import { OnChainService } from "@services/bria"

export const rebalanceToHotWallet = async ({
  amount,
}: {
  amount: number
}): Promise<UnsignedPsbt | ApplicationError> => {
  const checkedAmount = checkedToBtcPaymentAmount(amount)
  if (checkedAmount instanceof Error) return checkedAmount

  return OnChainService().rebalanceToHotWallet(checkedAmount)
}
