import { OnChainService } from "@services/lnd/onchain-service"
import { BTC_NETWORK } from "@config"
import { TxDecoder } from "@domain/bitcoin/onchain"

// logic to choose the correct onChain address for the swap out destination
// active lnd node that has ["onChain"] wallet
export const getSwapDestAddress = async (): Promise<
  OnChainAddress | OnChainServiceError
> => {
  const onChainService = OnChainService(TxDecoder(BTC_NETWORK))
  if (onChainService instanceof Error) return onChainService
  const onChainAddress = await onChainService.createOnChainAddress()
  if (onChainAddress instanceof Error) return onChainAddress
  return onChainAddress.address
}
