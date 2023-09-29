export * from "./rebalance-to-cold-wallet"
export * from "./record-hot-to-cold-transfer"

import { OnChainService } from "@services/bria"

export const getHotBalance = async (): Promise<BtcPaymentAmount | ApplicationError> => {
  const service = OnChainService()
  return service.getHotBalance()
}

export const getColdBalance = async (): Promise<BtcPaymentAmount | ApplicationError> => {
  const service = OnChainService()
  return service.getColdBalance()
}
