import { BTC_NETWORK, getSwapConfig } from "@config"
import { TxDecoder } from "@domain/bitcoin/onchain"
import { SwapServiceError, NoSwapAction } from "@domain/swap/errors"
import { OnChainService } from "@services/lnd/onchain-service"
import { toSats } from "@domain/bitcoin"
import { SwapOutChecker } from "@domain/swap"
import { baseLogger } from "@services/logger"
import { LoopService } from "@services/loopd"
import { addAttributesToCurrentSpan } from "@services/tracing"
import { getOffChainChannelBalances } from "@app/lightning"

import { loopdConfig } from "./swap-utils"

const logger = baseLogger.child({ module: "swap" })

export const swapOut = async (): Promise<
  SwapOutResult | SwapServiceError | NoSwapAction
> => {
  // TODO insert logic to get active LND service and active Loop node here
  const swapService = LoopService(loopdConfig)
  logger.info("SwapApp: Started")
  const onChainService = OnChainService(TxDecoder(BTC_NETWORK))
  if (onChainService instanceof Error) return onChainService

  const onChainBalance = await onChainService.getBalance()
  if (onChainBalance instanceof Error) return onChainBalance

  const offChainChannelBalances = await getOffChainChannelBalances()
  if (offChainChannelBalances instanceof Error) return offChainChannelBalances
  const outbound = offChainChannelBalances.outbound

  const minOnChainHotWalletBalanceConfig = getSwapConfig().minOnChainHotWalletBalance

  const swapChecker = SwapOutChecker({
    minOnChainHotWalletBalanceConfig,
    swapOutAmount: toSats(getSwapConfig().swapOutAmount),
  })
  const swapOutAmount = swapChecker.getSwapOutAmount({
    currentOnChainHotWalletBalance: onChainBalance,
    currentOutboundLiquidityBalance: outbound,
  })
  if (swapOutAmount instanceof Error) return swapOutAmount
  logger.info({ swapOutAmount }, "SwapOutChecker amount")

  addAttributesToCurrentSpan({
    "swap.amount": swapOutAmount,
  })

  if (swapOutAmount > 0) {
    const swapResult = await swapService.swapOut({ amount: swapOutAmount })
    if (swapResult instanceof Error) {
      addAttributesToCurrentSpan({
        "swap.error": JSON.stringify(swapResult),
      })
    } else {
      addAttributesToCurrentSpan({
        "swap.submitted": JSON.stringify(swapResult),
      })
    }
    return swapResult
  } else {
    return new NoSwapAction()
  }
}
