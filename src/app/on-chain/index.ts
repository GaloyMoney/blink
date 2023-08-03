import { OnChainService } from "@services/bria"

export const getHotBalance = async (): Promise<BtcPaymentAmount | ApplicationError> => {
  const service = OnChainService()
  return service.getHotBalance()
}

export const getColdBalance = async (): Promise<BtcPaymentAmount | ApplicationError> => {
  const service = OnChainService()
  return service.getColdBalance()
}
