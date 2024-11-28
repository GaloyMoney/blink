/**
 * how to run:
 *
 * pnpm tsx src/debug/void-onchain-payment.ts <journal id> <payout id>
 *
 * <journal id>: journal id to void.
 * <payout id>: bria payout id
 */

import { Wallets } from "@/app"

import { OnChainService } from "@/services/bria"
import { LedgerService } from "@/services/ledger"
import * as LedgerFacade from "@/services/ledger/facade"
import { lndsConnect } from "@/services/lnd/auth"
import { isUp } from "@/services/lnd/health"
import { setupMongoConnection } from "@/services/mongodb"

const onChainService = OnChainService()

const processPayment = async (payment: LedgerTransaction<WalletCurrency>) => {
  const payout = await onChainService.findPayoutByLedgerJournalId(payment.journalId)
  if (payout instanceof Error) {
    return new Error(`Failed to get payout: ${payout.name} - ${payout.message}`)
  }
  if (!payout.batchId || !payout.txId || !payout.vout) {
    return new Error("Missing required payout details")
  }

  const setTxIdResult = await LedgerFacade.setOnChainTxIdByPayoutId({
    payoutId: payout.id,
    txId: payout.txId,
    vout: payout.vout,
  })
  if (setTxIdResult instanceof Error) {
    return new Error(
      `Failed to set transaction ID: ${setTxIdResult.name} - ${setTxIdResult.message}`,
    )
  }

  const settledPayout = await Wallets.settlePayout(payout.id)
  if (settledPayout instanceof Error) {
    return new Error(
      `Failed to settle payout: ${settledPayout.name} - ${settledPayout.message}`,
    )
  }

  return true
}

const settlePendingOnchainPayments = async () => {
  const pendingPayments = LedgerService().listPendingOnchainPayments()
  if (pendingPayments instanceof Error) return pendingPayments

  let totalPayments = 0
  let successCount = 0
  let errorCount = 0
  const errors = []

  for await (const payment of pendingPayments) {
    totalPayments++
    console.log(`Processing payment ${totalPayments}`)

    const result = await processPayment(payment)
    if (result instanceof Error) {
      errorCount++
      errors.push({
        journalId: payment.journalId,
        payoutId: payment.payoutId,
        error: result.message,
      })
      console.error(`Failed to process payment: ${result.message}`)
      continue
    }

    successCount++
    console.log(
      `Successfully processed payout ${payment.payoutId} for journal ${payment.journalId}`,
    )
  }

  return {
    successCount,
    errorCount,
    total: totalPayments,
    errors,
  }
}

const main = async () => {
  const result = await settlePendingOnchainPayments()
  if (result instanceof Error) {
    console.error("Error:", result)
    return
  }
  console.log("Settlement process completed")
  console.log(`Total Processed: ${result.total}`)
  console.log(`Successful: ${result.successCount}`)
  console.log(`Failed: ${result.errorCount}`)

  if (result.errors.length > 0) {
    console.log("\nErrors:")
    result.errors.forEach(({ journalId, payoutId, error }) => {
      console.log(
        `- Journal ${journalId}${payoutId ? ` (Payout ${payoutId})` : ""}: ${error}`,
      )
    })
  }
}

setupMongoConnection()
  .then(async (mongoose) => {
    await Promise.all(lndsConnect.map((lndParams) => isUp(lndParams)))
    await main()
    if (mongoose) await mongoose.connection.close()
  })
  .catch((err) => console.log(err))
