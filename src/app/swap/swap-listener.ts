import { admin as LedgerAdmin } from "@services/ledger/admin"
import { WalletCurrency } from "@domain/shared"
import { SwapState, SwapType } from "@domain/swap"
import { addAttributesToCurrentSpan } from "@services/tracing"
import { DuplicateError } from "@domain/errors"

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
    addAttributesToCurrentSpan({
      "swap.handler.state": state,
      "swap.handler.type": type,
      "swap.handler.onchainMinerFee": Number(onchainMinerFee.amount),
      "swap.handler.offchainRoutingFee": Number(offchainRoutingFee.amount),
      "swap.handler.serviceProviderFee": Number(serviceProviderFee.amount),
      "swap.handler.totalFees": Number(totalFees),
    })
    if (type === SwapType.Swapout && state === SwapState.Success && totalFees > 0n) {
      const journalResponse = await LedgerAdmin.addSwapFeeTxSend(
        swapStatus.parsedSwapData,
      )
      if (journalResponse instanceof DuplicateError) return
      addAttributesToCurrentSpan({
        "swap.handler.success": JSON.stringify(journalResponse),
      })
    }
    if (state === SwapState.Failed) {
      addAttributesToCurrentSpan({
        "swap.error": JSON.stringify({
          "swap.handler.errorMsg": swapStatus.parsedSwapData.message,
          "swap.handler.errorSwapId": swapStatus.parsedSwapData.id,
          "swap.handler.errorAmt": Number(swapStatus.parsedSwapData.amt),
        }),
      })
    }
  }
}
