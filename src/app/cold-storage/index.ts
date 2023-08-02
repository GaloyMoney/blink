export * from "./rebalance-to-cold-wallet"
export * from "./record-income"

import { NewOnChainService } from "@services/bria"

export const getBalance = async (): Promise<BtcPaymentAmount | ApplicationError> => {
  const onChainService = await NewOnChainService()
  return onChainService.getColdBalance()
}
