import { BTC_NETWORK } from "@config"
import { TxDecoder } from "@domain/bitcoin/onchain"
import { SwapServiceError } from "@domain/swap/errors"
import { SwapOutResult } from "@domain/swap/index.types"
import { SwapService } from "@services/swap"
import { OnChainService } from "@services/lnd/onchain-service"

export const swapOut = async ({
  amount,
}: SwapOutArgs): Promise<SwapOutResult | SwapServiceError> => {
  const onChainService = OnChainService(TxDecoder(BTC_NETWORK))
  if (onChainService instanceof Error) return onChainService
  const balance = await onChainService.getBalance()
  if (balance instanceof Error) return balance

  // const minOnChainBalance = getSwapConfig().minOnChainBalance
  // const onChainBalance = await Lightning.getOnChainBalance()
  // if (onChainBalance < minOnChainBalance ) { @todo perform swap out }
  // @todo - add double entry book-keeping code for fees

  const swapResult = await SwapService.swapOut(amount)

  return swapResult
}
