/**
 * how to run:
 *	. ./.envrc && yarn ts-node \
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

const DEAD_LND_PUBKEYS = [
  "02ae3c066e67cf3951bb5230cf4e13aee053bc06465cd25f870988b691469140b0", // dead node in hack environment
]

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

    if (DEAD_LND_PUBKEYS.includes(pubkey)) {
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
