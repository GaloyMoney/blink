import { LndService } from "@/services/lnd"

export const listNodesPubkeys = async (): Promise<Pubkey[] | ApplicationError> => {
  const offChainService = LndService()
  if (offChainService instanceof Error) return offChainService

  return offChainService.listAllPubkeys()
}
