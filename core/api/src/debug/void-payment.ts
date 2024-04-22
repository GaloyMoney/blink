/**
 * how to run:
 *
 * . ./.envrc && yarn ts-node --files -r tsconfig-paths/register src/debug/void-payment.ts <journal id> <payment hash> <validate with lnd true|false>
 *
 * <journal id>: journal id to void.
 * <payment hash>: payment hash to void.
 * <validateLnd>: true if hash needs to be validated against lnd. Must be the last param
 */
import { PaymentStatus } from "@/domain/bitcoin/lightning"

import { LndService } from "@/services/lnd"
import { isUp } from "@/services/lnd/health"
import { lndsConnect } from "@/services/lnd/auth"
import { LedgerService } from "@/services/ledger"
import * as LedgerFacade from "@/services/ledger/facade"
import { setupMongoConnection } from "@/services/mongodb"

const voidPayment = async ({
  journalId,
  paymentHash,
  validateLnd = true,
}: {
  journalId: LedgerJournalId
  paymentHash: PaymentHash
  validateLnd: boolean
}) => {
  const ledgerService = LedgerService()
  const ledgerTransactions = await ledgerService.getTransactionsByHash(paymentHash)
  if (ledgerTransactions instanceof Error) return ledgerTransactions

  const payment = ledgerTransactions.find(
    (tx) => tx.pendingConfirmation && tx.journalId === journalId,
  )
  if (!payment) return new Error("Invalid payment hash or payment has been handled")

  const lndService = LndService()
  if (lndService instanceof Error) return lndService

  const lndPayment = await lndService.lookupPayment({ paymentHash })
  const lndPaymentExists = !(lndPayment instanceof Error)
  if (validateLnd && !lndPaymentExists) return lndPayment

  // this will be handled by trigger
  if (lndPaymentExists && lndPayment.status === PaymentStatus.Settled)
    return new Error("Payment has been settled")

  // TODO: add timeout validation
  if (
    lndPaymentExists &&
    lndPayment.status === PaymentStatus.Pending &&
    payment.timestamp > new Date(Date.now() - 1296e6)
  )
    return new Error("You need to wait at least 15 days to void a payment")

  const settled = await LedgerFacade.settlePendingLnSend(paymentHash)
  if (settled instanceof Error) return settled

  const reverted = await LedgerFacade.recordLnSendRevert({
    journalId: payment.journalId,
    paymentHash,
  })
  if (reverted instanceof Error) return reverted

  return true
}

const main = async () => {
  const args = process.argv.slice(-3)
  const params = {
    journalId: args[0] as LedgerJournalId,
    paymentHash: args[1] as PaymentHash,
    validateLnd: args[2] !== "false",
  }
  const result = await voidPayment(params)
  if (result instanceof Error) {
    console.error("Error:", result)
    return
  }
  console.log(`Voided payment ${params.paymentHash}: `, result)
}

setupMongoConnection()
  .then(async (mongoose) => {
    await Promise.all(lndsConnect.map((lndParams) => isUp(lndParams)))
    await main()
    if (mongoose) await mongoose.connection.close()
  })
  .catch((err) => console.log(err))
