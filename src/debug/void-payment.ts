/**
 * how to run:
 *
 * . ./.envrc && yarn ts-node --files -r tsconfig-paths/register src/debug/void-payment.ts <payment hash>
 *
 * <payment hash>: payment hash to void. Must be the last param
 */
import { PaymentStatus } from "@domain/bitcoin/lightning"
import { params as unauthParams } from "@services/lnd/unauth"
import { setupMongoConnection } from "@services/mongodb"
import { LedgerService } from "@services/ledger"
import { isUp } from "@services/lnd/health"
import { LndService } from "@services/lnd"

const voidPayment = async (paymentHash: PaymentHash) => {
  const ledgerService = LedgerService()
  const ledgerTransactions = await ledgerService.getTransactionsByHash(paymentHash)
  if (ledgerTransactions instanceof Error) return ledgerTransactions

  const payment = ledgerTransactions.find((tx) => tx.pendingConfirmation)
  if (!payment) return new Error("Invalid payment hash or payment has been handled")

  const lndService = LndService()
  if (lndService instanceof Error) return lndService

  const lndPayment = await lndService.lookupPayment({ paymentHash })
  if (lndPayment instanceof Error) return lndPayment

  // this will be handled by trigger
  if (lndPayment.status === PaymentStatus.Settled)
    return new Error("Payment has been settled")

  // TODO: add timeout validation
  if (
    lndPayment.status === PaymentStatus.Pending &&
    payment.timestamp > new Date(Date.now() - 1296e6)
  )
    return new Error("You need to wait at least 15 days to void a payment")

  const settled = await ledgerService.settlePendingLnPayment(paymentHash)
  if (settled instanceof Error) return settled

  const reverted = await ledgerService.revertLightningPayment({
    journalId: payment.journalId,
    paymentHash,
  })
  if (reverted instanceof Error) return reverted

  return true
}

const main = async () => {
  const args = process.argv
  const result = await voidPayment(args.at(-1) as PaymentHash)
  if (result instanceof Error) {
    console.error("Error:", result)
    return
  }
  console.log(`Voided payment ${args.at(-1)}: `, result)
}

setupMongoConnection()
  .then(async (mongoose) => {
    await Promise.all(unauthParams.map((lndParams) => isUp(lndParams)))
    await main()
    if (mongoose) await mongoose.connection.close()
  })
  .catch((err) => console.log(err))
