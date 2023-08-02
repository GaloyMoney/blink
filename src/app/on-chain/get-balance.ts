import { NewOnChainService } from "@services/bria"

export const getHotBalance = async (): Promise<BtcPaymentAmount | ApplicationError> => {
  const service = NewOnChainService()
  return service.getHotBalance()
}
