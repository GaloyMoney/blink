import { toSats } from "@domain/bitcoin"

import { admin as LedgerAdmin } from "@services/ledger/admin"
import { WalletCurrency } from "@domain/shared"
import { LedgerTransactionType } from "@domain/ledger"
import { SwapType } from "@domain/swap"

export async function handleSwapOutCompleted(swapStatus: SwapStatusResultWrapper) {
  if (swapStatus.parsedSwapData) {
    const type = swapStatus.parsedSwapData.swapType
    const onchainMinerFee = toSats(swapStatus.parsedSwapData.onchainMinerFee)
    const offchainRoutingFee = toSats(swapStatus.parsedSwapData.offchainRoutingFee)
    const serviceProviderFee = toSats(swapStatus.parsedSwapData.serviceProviderFee)
    const totalFees = onchainMinerFee + offchainRoutingFee + serviceProviderFee
    // TODO log parsedSwapData.message
    if (type === SwapType.SWAP_OUT && totalFees > 0) {
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
      recordSwapFeeToLedger(swapFeeMetadata)
    }
  }
}

export function handleSwapOutFailure(data) {
  return data
}

export async function recordSwapFeeToLedger(swapFeeMetadata: SwapFeeLedgerMetadata) {
  const description = `Swap out fee for swapId ${swapFeeMetadata.swapId}`
  const journalResponse = await LedgerAdmin.addSwapFeeTxSend({
    swapFeeMetadata,
    description,
  })
  return journalResponse
}
