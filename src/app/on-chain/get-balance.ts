import { NewOnChainService } from "@services/bria"

export const getTotalBalance = async (): Promise<BtcPaymentAmount | ApplicationError> => {
  const service = NewOnChainService()
  return service.getBalance()
}
