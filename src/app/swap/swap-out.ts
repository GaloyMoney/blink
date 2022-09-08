import { BTC_NETWORK, getSwapConfig } from "@config"
import { TxDecoder } from "@domain/bitcoin/onchain"
import { SwapServiceError, NoSwapAction } from "@domain/swap/errors"
import { OnChainService } from "@services/lnd/onchain-service"
import { toSats } from "@domain/bitcoin"
import { SwapOutChecker } from "@domain/swap"
import { baseLogger } from "@services/logger"
import { LoopService } from "@services/loopd"
import { addAttributesToCurrentSpan } from "@services/tracing"
import { LndService } from "@services/lnd"

import { getActiveLoopd } from "./get-active-loopd"
import { getSwapDestAddress } from "./get-swap-dest-address"

const logger = baseLogger.child({ module: "swap" })

export const swapOut = async (): Promise<
  SwapOutResult | SwapServiceError | NoSwapAction
> => {
  logger.info("SwapApp: Started")
  const activeLoopdConfig = getActiveLoopd()
  const swapService = LoopService(activeLoopdConfig)

  const onChainService = OnChainService(TxDecoder(BTC_NETWORK))
  if (onChainService instanceof Error) return onChainService
  const onChainBalance = await onChainService.getBalance()
  if (onChainBalance instanceof Error) return onChainBalance
  const offChainService = LndService()
  if (offChainService instanceof Error) return offChainService
  const offChainChannelBalances = await offChainService.getInboundOutboundBalance()
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

  if (swapOutAmount > 0) {
    logger.info(
      { swapOutAmount, activeLoopdConfig },
      `Initiating swapout for ${swapOutAmount} sats`,
    )
    addAttributesToCurrentSpan({
      "swap.amount": swapOutAmount,
    })
    const swapDestAddress = await getSwapDestAddress()
    if (swapDestAddress instanceof Error) return swapDestAddress
    const swapResult = await swapService.swapOut({
      amount: swapOutAmount,
      swapDestAddress,
    })
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
