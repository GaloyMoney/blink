/**
 * how to run:
 *	. ./.envrc && PUBKEY="" \
 *    yarn ts-node \
 *		--files \
 *			-r tsconfig-paths/register \
 *			-r src/services/tracing.ts \
 *		src/debug/clean-pending-payments-for-dead-node.ts
 */

import { LedgerTransactionType, UnknownLedgerError } from "@domain/ledger"

import { isUp } from "@services/lnd/health"
import { params as unauthParams } from "@services/lnd/unauth"

import { setupMongoConnection } from "@services/mongodb"
import { LedgerService, translateToLedgerTx } from "@services/ledger"
import { LockService } from "@services/lock"
import { baseLogger } from "@services/logger"

import { MainBook } from "@services/ledger/books"

const PUBKEY = process.env.PUBKEY

const listAllPendingPayments = async (): Promise<
  LedgerTransaction<WalletCurrency>[] | LedgerError
> => {
  try {
    const { results } = await MainBook.ledger({
      type: LedgerTransactionType.Payment,
      pending: true,
    })

    return results.filter((tx) => tx.debit > 0).map((tx) => translateToLedgerTx(tx))
  } catch (err) {
    return new UnknownLedgerError(err)
  }
}

const main = async (): Promise<true | ApplicationError> => {
  const pendingPayments = await listAllPendingPayments()
  if (pendingPayments instanceof Error) return pendingPayments

  for (const payment of pendingPayments) {
    const { paymentHash, pubkey } = payment
    if (pubkey === undefined) continue
    if (paymentHash === undefined) continue

    if (PUBKEY && PUBKEY === pubkey) {
      console.log("HERE 0:", `deleting ${paymentHash}`)
      await LockService().lockPaymentHash(
        paymentHash,
        async (): Promise<true | LedgerServiceError> => {
          const ledgerService = LedgerService()
          const settled = await ledgerService.settlePendingLnPayment(paymentHash)
          if (settled instanceof Error) {
            baseLogger.error({ error: settled }, "no transaction to update")
            return settled
          }

          const voided = await ledgerService.revertLightningPayment({
            journalId: payment.journalId,
            paymentHash,
          })
          if (voided instanceof Error) {
            const error = `error voiding payment entry`
            baseLogger.fatal({ success: false, result: payment }, error)
            return voided
          }
          return true
        },
      )
    }
  }

  return true
}

setupMongoConnection(false)
  .then(async (mongoose) => {
    await Promise.all(unauthParams.map((lndParams) => isUp(lndParams)))
    await main()
    if (mongoose) await mongoose.connection.close()
  })
  .catch((err) => console.log(err))
