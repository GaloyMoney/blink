import { BTC_NETWORK, getColdStorageConfig } from "@config"
import { TxDecoder } from "@domain/bitcoin/onchain"
import { SwapServiceError } from "@domain/swap/errors"
import { OnChainService } from "@services/lnd/onchain-service"
import { toSats } from "@domain/bitcoin"
import { SwapOutChecker } from "@domain/swap"
import { baseLogger } from "@services/logger"
import { SwapService } from "@services/swap"
import { SwapOutResult } from "@domain/swap/index.types"

const logger = baseLogger.child({ module: "swap" })

export const swapOut = async ({
  amount,
}: SwapOutArgs): Promise<SwapOutResult | SwapServiceError> => {
  logger.info("SwapApp: Started")
  const onChainService = OnChainService(TxDecoder(BTC_NETWORK))
  if (onChainService instanceof Error) return onChainService

  const onChainBalance = await onChainService.getBalance()
  if (onChainBalance instanceof Error) return onChainBalance

  const swapChecker = SwapOutChecker({
    currentOnChainHotWalletBalance: onChainBalance,
    minOnChainHotWalletBalanceConfig: getColdStorageConfig().minOnChainHotWalletBalance,
  })
  const isOnChainWalletDepleted = swapChecker.isOnChainWalletDepleted()
  logger.info(`SwapApp: isOnChainWalletDepleted: ${isOnChainWalletDepleted}`)
  if (isOnChainWalletDepleted) {
    const swapResult = await SwapService.swapOut(toSats(amount))
    return swapResult
  } else {
    return new SwapServiceError("No Swap Out needed")
  }
}
