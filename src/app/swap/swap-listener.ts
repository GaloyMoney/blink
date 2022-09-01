import { toSats } from "@domain/bitcoin"

import { admin as LedgerAdmin } from "@services/ledger/admin"
import { WalletCurrency } from "@domain/shared"
import { LedgerTransactionType } from "@domain/ledger"
import { SwapState, SwapType } from "@domain/swap"
import { addAttributesToCurrentSpan } from "@services/tracing"
import { SwapErrorNoActiveLoopdNode } from "@domain/swap/errors"

export const startSwapMonitor = async (swapService: ISwapService) => {
  const isSwapServerUp = await swapService.healthCheck()
  if (isSwapServerUp) {
    const listener = swapService.swapListener()
    listener.on("data", (response) => {
      // const swapData = response.parsedSwapData
      // logger.info({ swapData }, "listenerSwapMonitor")
      handleSwapOutCompleted(response)
    })
  } else {
    return SwapErrorNoActiveLoopdNode
  }
}

export const handleSwapOutCompleted = async (swapStatus: SwapStatusResultWrapper) => {
  if (swapStatus.parsedSwapData) {
    const type = swapStatus.parsedSwapData.swapType
    const onchainMinerFee = toSats(swapStatus.parsedSwapData.onchainMinerFee)
    const offchainRoutingFee = toSats(swapStatus.parsedSwapData.offchainRoutingFee)
    const serviceProviderFee = toSats(swapStatus.parsedSwapData.serviceProviderFee)
    const totalFees = onchainMinerFee + offchainRoutingFee + serviceProviderFee
    const state = swapStatus.parsedSwapData.state
    if (type === SwapType.SWAP_OUT && state === SwapState.SUCCESS && totalFees > 0) {
      const swapFeeMetadata: SwapFeeLedgerMetadata = {
        swapId: swapStatus.parsedSwapData.id,
        swapAmount: toSats(swapStatus.parsedSwapData.amt),
        htlcAddress: swapStatus.parsedSwapData.htlcAddress,
        onchainMinerFee,
        offchainRoutingFee,
        serviceProviderFee,
        serviceProvider: "LOOP",
        currency: WalletCurrency.Btc,
        type: LedgerTransactionType.Fee,
        pending: false,
      }
      addAttributesToCurrentSpan({
        "swap.success": JSON.stringify(swapFeeMetadata),
      })
      await recordSwapFeeToLedger(swapFeeMetadata)
    }
    if (state === SwapState.FAILED) {
      addAttributesToCurrentSpan({
        "swap.error": JSON.stringify({
          swapId: swapStatus.parsedSwapData.id,
          message: swapStatus.parsedSwapData.message,
          amt: swapStatus.parsedSwapData.amt.toString(),
        }),
      })
    }
  }
  return true
}

export async function recordSwapFeeToLedger(swapFeeMetadata: SwapFeeLedgerMetadata) {
  const description = `Swap out fee for swapId ${swapFeeMetadata.swapId}`
  // TODO - Check if swapId is already recorded in the ledger to avoid dups
  const journalResponse = await LedgerAdmin.addSwapFeeTxSend({
    swapFeeMetadata,
    description,
  })
  return journalResponse
}
