import { OnChainService } from "@services/bria"

export const getBalance = async (): Promise<BtcPaymentAmount | ApplicationError> => {
  const onChainService = await OnChainService()
  return onChainService.getColdBalance()
}
