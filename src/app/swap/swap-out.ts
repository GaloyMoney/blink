import { BTC_NETWORK, getSwapConfig } from "@config"
import { TxDecoder } from "@domain/bitcoin/onchain"
import { NoOutboundLiquidityForSwapError, SwapServiceError } from "@domain/swap/errors"
import { OnChainService } from "@services/lnd/onchain-service"
import { SwapOutChecker } from "@domain/swap"
import { baseLogger } from "@services/logger"
import { LoopService } from "@services/loopd"
import { addAttributesToCurrentSpan } from "@services/tracing"
import { LndService } from "@services/lnd"

import { WalletCurrency } from "@domain/shared"

import { getActiveLoopd } from "./get-active-loopd"
import { getSwapDestAddress } from "./get-swap-dest-address"

const logger = baseLogger.child({ module: "swap" })

export const swapOut = async (): Promise<
  SwapOutResult | NoOutboundLiquidityForSwapError | SwapServiceError
> => {
  addAttributesToCurrentSpan({
    "swap.event": "started",
  })
  const activeLoopdConfig = getActiveLoopd()
  const swapService = LoopService(activeLoopdConfig)
  if (!swapService.healthCheck()) return new SwapServiceError("Failed health check")
  const onChainService = OnChainService(TxDecoder(BTC_NETWORK))
  if (onChainService instanceof Error) return onChainService
  const onChainBalance = await onChainService.getBalance()
  if (onChainBalance instanceof Error) return onChainBalance
  const offChainService = LndService()
  if (offChainService instanceof Error) return offChainService
  const offChainChannelBalances = await offChainService.getInboundOutboundBalance()
  if (offChainChannelBalances instanceof Error) return offChainChannelBalances
  const outbound = offChainChannelBalances.outbound
  const loopOutWhenHotWalletLessThanConfig = getSwapConfig().loopOutWhenHotWalletLessThan

  const swapChecker = SwapOutChecker({
    loopOutWhenHotWalletLessThanConfig,
    swapOutAmount: getSwapConfig().swapOutAmount,
  })
  const swapOutAmount = swapChecker.getSwapOutAmount({
    currentOnChainHotWalletBalance: {
      amount: BigInt(onChainBalance),
      currency: WalletCurrency.Btc,
    },
    currentOutboundLiquidityBalance: {
      amount: BigInt(outbound),
      currency: WalletCurrency.Btc,
    },
  })

  const swapNoOp: SwapOutResult = {
    noOp: true,
    htlcAddress: "" as OnChainAddress,
    serverMessage: "",
    swapId: "" as SwapId,
    swapIdBytes: "",
  }
  if (swapOutAmount.amount === 0n) return swapNoOp

  const hasEnoughOutboundLiquidity = outbound > swapOutAmount.amount
  if (!hasEnoughOutboundLiquidity) {
    addAttributesToCurrentSpan({
      "swap.checker.message": "Not enough outbound liquidity to perform swap out",
      "swap.checker.outboundAmountNeeded": Number(swapOutAmount.amount),
      "swap.checker.currentOutboundBalance": outbound,
    })
    return swapNoOp
  }

  logger.info({ swapOutAmount, activeLoopdConfig }, `Initiating swapout`)
  addAttributesToCurrentSpan({
    "swap.amount": Number(swapOutAmount.amount),
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
}
