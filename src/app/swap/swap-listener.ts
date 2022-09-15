import { toSats } from "@domain/bitcoin"

import { admin as LedgerAdmin } from "@services/ledger/admin"
import { WalletCurrency } from "@domain/shared"
import { LedgerTransactionType } from "@domain/ledger"
import { SwapProvider, SwapState, SwapType } from "@domain/swap"
import { addAttributesToCurrentSpan } from "@services/tracing"
import { SwapErrorNoActiveLoopdNode } from "@domain/swap/errors"
import { sha256 } from "@domain/bitcoin/lightning"

export const startSwapMonitor = async (swapService: ISwapService) => {
  const isSwapServerUp = await swapService.healthCheck()
  if (isSwapServerUp instanceof Error) return new SwapErrorNoActiveLoopdNode()
  const listener = swapService.swapListener()
  listener.on("data", (response) => {
    handleSwapOutCompleted(response)
  })
}

export const handleSwapOutCompleted = async (swapStatus: SwapStatusResultWrapper) => {
  if (swapStatus.parsedSwapData) {
    const type = swapStatus.parsedSwapData.swapType
    const onchainMinerFee = toSats(swapStatus.parsedSwapData.onchainMinerFee)
    const offchainRoutingFee = toSats(swapStatus.parsedSwapData.offchainRoutingFee)
    const serviceProviderFee = toSats(swapStatus.parsedSwapData.serviceProviderFee)
    const totalFees = onchainMinerFee + offchainRoutingFee + serviceProviderFee
    const state = swapStatus.parsedSwapData.state
    if (type === SwapType.Swapout && state === SwapState.Success && totalFees > 0) {
      const swapId = swapStatus.parsedSwapData.id as SwapId
      const swapFeeMetadata: SwapTransactionMetadataUpdate = {
        hash: sha256(Buffer.from(swapId)) as SwapHash,
        swapId: swapStatus.parsedSwapData.id as SwapId,
        swapAmount: toSats(swapStatus.parsedSwapData.amt),
        htlcAddress: swapStatus.parsedSwapData.htlcAddress as OnChainAddress,
        onchainMinerFee,
        offchainRoutingFee,
        serviceProviderFee,
        serviceProvider: SwapProvider.Loop,
        currency: WalletCurrency.Btc,
        type: LedgerTransactionType.Fee,
      }
      await recordSwapFeeToLedger(swapFeeMetadata)
      addAttributesToCurrentSpan({
        "swap.success": JSON.stringify(swapFeeMetadata),
      })
    }
    if (state === SwapState.Failed) {
      addAttributesToCurrentSpan({
        "swap.error": JSON.stringify({
          swapId: swapStatus.parsedSwapData.id,
          message: swapStatus.parsedSwapData.message,
          amt: swapStatus.parsedSwapData.amt.toString(),
        }),
      })
    }
  }
}

export async function recordSwapFeeToLedger(
  swapFeeMetadata: SwapTransactionMetadataUpdate,
) {
  const description = `Swap out fee for swapId ${swapFeeMetadata.swapId}`
  const journalResponse = await LedgerAdmin.addSwapFeeTxSend({
    swapFeeMetadata,
    description,
  })
  return journalResponse
}
