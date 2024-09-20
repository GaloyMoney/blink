/**
 * how to run:
 *
 * pnpm tsx src/debug/void-onchain-payment.ts <journal id> <payout id>
 *
 * <journal id>: journal id to void.
 * <payout id>: bria payout id
 */

import { isUp } from "@/services/lnd/health"
import { lndsConnect } from "@/services/lnd/auth"
import * as LedgerFacade from "@/services/ledger/facade"
import { setupMongoConnection } from "@/services/mongodb"

const voidOnchainPayment = async ({
  journalId,
  payoutId,
}: {
  journalId: LedgerJournalId
  payoutId: PayoutId
}) => {
  const ledgerTransactions = await LedgerFacade.getTransactionsByPayoutId(payoutId)
  if (ledgerTransactions instanceof Error) return ledgerTransactions

  const payment = ledgerTransactions.find(
    (tx) => tx.pendingConfirmation && tx.journalId === journalId,
  )
  if (!payment) return new Error("Invalid payment payoutId or payment has been handled")

  const reverted = await LedgerFacade.recordOnChainSendRevert({
    journalId,
    payoutId,
  })
  if (reverted instanceof Error) return reverted

  return true
}

const main = async () => {
  const args = process.argv.slice(-2)
  const params = {
    journalId: args[0] as LedgerJournalId,
    payoutId: args[1] as PayoutId,
  }
  const result = await voidOnchainPayment(params)
  if (result instanceof Error) {
    console.error("Error:", result)
    return
  }
  console.log(`Voided payment for payout id ${params.payoutId}: `, result)
}

setupMongoConnection()
  .then(async (mongoose) => {
    await Promise.all(lndsConnect.map((lndParams) => isUp(lndParams)))
    await main()
    if (mongoose) await mongoose.connection.close()
  })
  .catch((err) => console.log(err))
