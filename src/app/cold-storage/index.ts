export * from "./rebalance-to-cold-wallet"
export * from "./record-income"

import { OnChainService } from "@services/bria"

export const getBalance = async (): Promise<BtcPaymentAmount | ApplicationError> => {
  const onChainService = await OnChainService()
  return onChainService.getColdBalance()
}
