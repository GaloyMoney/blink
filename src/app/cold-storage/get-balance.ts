import { NewOnChainService } from "@services/bria"

export const getBalance = async (): Promise<BtcPaymentAmount | ApplicationError> => {
  const onChainService = await NewOnChainService()
  return onChainService.getColdBalance()
}
