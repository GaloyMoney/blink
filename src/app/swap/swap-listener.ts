import { admin as LedgerAdmin } from "@services/ledger/admin"
import { WalletCurrency } from "@domain/shared"
import { SwapState, SwapType } from "@domain/swap"
import { addAttributesToCurrentSpan } from "@services/tracing"
import { SwapErrorNoActiveLoopdNode } from "@domain/swap/errors"
import { DuplicateError } from "@domain/errors"

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
    const onchainMinerFee = {
      amount: BigInt(swapStatus.parsedSwapData.onchainMinerFee),
      currency: WalletCurrency.Btc,
    }
    const offchainRoutingFee = {
      amount: BigInt(swapStatus.parsedSwapData.offchainRoutingFee),
      currency: WalletCurrency.Btc,
    }
    const serviceProviderFee = {
      amount: BigInt(swapStatus.parsedSwapData.serviceProviderFee),
      currency: WalletCurrency.Btc,
    }
    const totalFees =
      onchainMinerFee.amount + offchainRoutingFee.amount + serviceProviderFee.amount
    const state = swapStatus.parsedSwapData.state
    if (type === SwapType.Swapout && state === SwapState.Success && totalFees > 0n) {
      const journalResponse = await LedgerAdmin.addSwapFeeTxSend(
        swapStatus.parsedSwapData,
      )
      if (journalResponse instanceof DuplicateError) return
      addAttributesToCurrentSpan({
        "swap.success": JSON.stringify(journalResponse),
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
