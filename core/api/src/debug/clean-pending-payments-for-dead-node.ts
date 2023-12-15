/**
 * how to run:
 *	. ./.envrc && yarn ts-node \
 *		--files \
 *			-r tsconfig-paths/register \
 *			-r src/services/tracing.ts \
 *		src/debug/clean-pending-payments-for-dead-node.ts <pubkey>
 */

import { LedgerTransactionType, UnknownLedgerError } from "@/domain/ledger"

import { isUp } from "@/services/lnd/health"
import { lndsConnect } from "@/services/lnd/auth"

import { setupMongoConnection } from "@/services/mongodb"
import { LedgerService, translateToLedgerTx } from "@/services/ledger"
import * as LedgerFacade from "@/services/ledger/facade"
import { LockService } from "@/services/lock"
import { baseLogger } from "@/services/logger"

import { MainBook } from "@/services/ledger/books"

const PUBKEY = process.argv[2]

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
  baseLogger.info(`Started script for pubkey: ${PUBKEY}`)
  const pendingPayments = await listAllPendingPayments()
  if (pendingPayments instanceof Error) return pendingPayments

  for (const payment of pendingPayments) {
    const { paymentHash, pubkey } = payment
    if (pubkey === undefined) continue
    if (paymentHash === undefined) continue

    if (PUBKEY && PUBKEY === pubkey) {
      baseLogger.info(`deleting ${paymentHash}`)
      await LockService().lockPaymentHash(
        paymentHash,
        async (): Promise<true | LedgerServiceError> => {
          const settled = await LedgerFacade.settlePendingLnSend(paymentHash)
          if (settled instanceof Error) {
            baseLogger.error({ error: settled }, "no transaction to update")
            return settled
          }

          const ledgerService = LedgerService()
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

  baseLogger.info(`Finished script for pubkey: ${PUBKEY}`)
  return true
}

setupMongoConnection(false)
  .then(async (mongoose) => {
    await Promise.all(lndsConnect.map((lndParams) => isUp(lndParams)))
    await main()
    if (mongoose) await mongoose.connection.close()
  })
  .catch((err) => console.log(err))
