import { PaymentStatus } from "@domain/bitcoin/lightning"
import { InconsistentDataError } from "@domain/errors"
import { LedgerService } from "@services/ledger"
import { LndService } from "@services/lnd"
import { LockService } from "@services/lock"
import { reimburseFee } from "@app/wallets/reimburse-fee"
import { LnPaymentsRepository } from "@services/mongoose/ln-payments"
import { toSats } from "@domain/bitcoin"

export const updatePendingPayments = async ({
  walletId,
  logger,
  lock,
}: {
  walletId: WalletId
  logger: Logger
  lock?: DistributedLock
}): Promise<void | ApplicationError> => {
  const ledgerService = LedgerService()
  const count = await ledgerService.getPendingPaymentsCount(walletId)
  if (count instanceof Error) return count
  if (count === 0) return

  const pendingPaymentTransactions = await ledgerService.listPendingPayments(walletId)
  if (pendingPaymentTransactions instanceof Error) return pendingPaymentTransactions

  for (const paymentLiabilityTx of pendingPaymentTransactions) {
    await updatePendingPayment({ walletId, paymentLiabilityTx, logger, lock })
  }
}

const updatePendingPayment = async ({
  walletId,
  paymentLiabilityTx,
  logger,
  lock,
}: {
  walletId: WalletId
  paymentLiabilityTx: LedgerTransaction
  logger: Logger
  lock?: DistributedLock
}): Promise<void | ApplicationError> => {
  const paymentLogger = logger.child({
    topic: "payment",
    protocol: "lightning",
    transactionType: "payment",
    onUs: false,
    payment: paymentLiabilityTx,
  })

  const lndService = LndService()
  if (lndService instanceof Error) return lndService

  const { paymentHash, pubkey } = paymentLiabilityTx
  // If we had PaymentLedgerType => no need for checking the fields
  if (!paymentHash)
    throw new InconsistentDataError("paymentHash missing from payment transaction")
  if (!pubkey) throw new InconsistentDataError("pubkey missing from payment transaction")

  const lnPaymentLookupFromLightningPromise = lndService.lookupPayment({
    pubkey,
    paymentHash,
  })
  const lnPaymentLookupPromise = LnPaymentsRepository().findByPaymentHash(paymentHash)

  const lightningLogger = logger.child({
    topic: "payment",
    protocol: "lightning",
    transactionType: "payment",
    onUs: false,
  })

  const [lnPaymentLookupFromLightning, lnPaymentLookup] = await Promise.all([
    lnPaymentLookupFromLightningPromise,
    lnPaymentLookupPromise,
  ])
  if (lnPaymentLookupFromLightning instanceof Error) {
    lightningLogger.error(
      { err: lnPaymentLookupFromLightning },
      "issue fetching payment from lightning service",
    )
    return lnPaymentLookupFromLightning
  }
  if (lnPaymentLookup instanceof Error) {
    lightningLogger.error(
      { err: lnPaymentLookup },
      "issue fetching payment from database",
    )
  } else {
    lnPaymentLookup.status = lnPaymentLookupFromLightning.status
    if (lnPaymentLookupFromLightning.status !== PaymentStatus.Failed) {
      lnPaymentLookup.paymentDetails = lnPaymentLookupFromLightning.paymentDetails
    }
  }

  const status = lnPaymentLookupFromLightning.status
  const roundedUpFee =
    lnPaymentLookupFromLightning.paymentDetails?.roundedUpFee || toSats(0)

  if (status === PaymentStatus.Settled || status === PaymentStatus.Failed) {
    const ledgerService = LedgerService()
    return LockService().lockPaymentHash({ paymentHash, logger, lock }, async () => {
      const recorded = await ledgerService.isLnTxRecorded(paymentHash)
      if (recorded instanceof Error) {
        paymentLogger.error({ error: recorded }, "we couldn't query pending transaction")
        return recorded
      }

      if (recorded) {
        paymentLogger.info("payment has already been processed")
        return
      }

      const settled = await ledgerService.settlePendingLnPayments(paymentHash)
      if (settled instanceof Error) {
        paymentLogger.error(
          { error: settled },
          "we didn't have any transaction to update",
        )
        return settled
      }

      if (!(lnPaymentLookup instanceof Error)) {
        lnPaymentLookup.createdAt = lnPaymentLookup.createdAt || new Date(Date.now())
        const persistedPayment = await LnPaymentsRepository().update(lnPaymentLookup)
        if (persistedPayment instanceof Error) {
          paymentLogger.error(
            { error: persistedPayment },
            "we couldn't update payment data to our database",
          )
        }
      }

      if (status === PaymentStatus.Settled) {
        paymentLogger.info(
          { success: true, id: paymentHash, payment: paymentLiabilityTx },
          "payment has been confirmed",
        )
        if (paymentLiabilityTx.feeKnownInAdvance) return

        return reimburseFee({
          walletId,
          journalId: paymentLiabilityTx.journalId,
          paymentHash,
          maxFee: paymentLiabilityTx.fee,
          actualFee: roundedUpFee,
          logger,
        })
      }

      return revertTransaction({
        paymentLiabilityTx,
        lnPaymentLookup:
          lnPaymentLookup instanceof Error
            ? lnPaymentLookupFromLightning
            : lnPaymentLookup,
        logger: paymentLogger,
      })
    })
  }
}

const revertTransaction = async ({
  paymentLiabilityTx,
  lnPaymentLookup,
  logger,
}: {
  paymentLiabilityTx: LedgerTransaction
  lnPaymentLookup: LnPaymentLookup
  logger: Logger
}): Promise<void | ApplicationError> => {
  const ledgerService = LedgerService()
  const voided = await ledgerService.voidLedgerTransactionsForJournal(
    paymentLiabilityTx.journalId,
  )
  if (voided instanceof Error) {
    const error = `error voiding payment entry`
    logger.fatal(
      {
        success: false,
        result: lnPaymentLookup,
      },
      error,
    )
    return voided
  }
}
