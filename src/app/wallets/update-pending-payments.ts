import { PaymentStatus } from "@domain/bitcoin/lightning"
import { InconsistentDataError } from "@domain/errors"
import { toLiabilitiesAccountId } from "@domain/ledger"
import { FeeReimbursement } from "@domain/ledger/fee-reimbursement"
import { LedgerService } from "@services/ledger"
import { LndService } from "@services/lnd"
import { LockService } from "@services/lock"
import { PriceService } from "@services/price"

export const updatePendingPayments = async ({
  walletId,
  logger,
  lock,
}: {
  walletId: WalletId
  logger: Logger
  lock?: DistributedLock
}): Promise<void | ApplicationError> => {
  const liabilitiesAccountId = toLiabilitiesAccountId(walletId)

  const lockService = LockService()
  await lockService.lockWalletId({ walletId, logger }, async () => {
    const ledgerService = LedgerService()
    const pendingPaymentTransactions = await ledgerService.listPendingPayments(
      liabilitiesAccountId,
    )
    if (pendingPaymentTransactions instanceof Error) return pendingPaymentTransactions

    for (const paymentLiabilityTx of pendingPaymentTransactions) {
      await updatePendingPayment({ walletId, paymentLiabilityTx, logger })
    }
  })
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
    return new InconsistentDataError("paymentHash missing from payment transaction")
  if (!pubkey) return new InconsistentDataError("pubkey missing from payment transaction")

  const lnPaymentLookup = await lndService.lookupPayment({
    pubkey,
    paymentHash,
  })
  if (lnPaymentLookup instanceof Error) {
    const lightningLogger = logger.child({
      topic: "payment",
      protocol: "lightning",
      transactionType: "payment",
      onUs: false,
    })
    lightningLogger.error({ err: lnPaymentLookup }, "issue fetching payment")
    return lnPaymentLookup
  }
  const { status, roundedUpFee } = lnPaymentLookup

  if (status === PaymentStatus.Settled || status === PaymentStatus.Failed) {
    const ledgerService = LedgerService()
    const settled = await ledgerService.settlePendingLiabilityTransactions(paymentHash)
    if (settled instanceof Error) {
      paymentLogger.error({ error: settled }, "we didn't have any transaction to update")
      return settled
    }

    // PaymentStatus.Failed transactions have null 'roundedUpFee'
    if (status === PaymentStatus.Settled && roundedUpFee !== null) {
      paymentLogger.info(
        { success: true, id: paymentHash, payment: paymentLiabilityTx },
        "payment has been confirmed",
      )
      return reimburseFee({
        walletId,
        paymentLiabilityTx,
        roundedUpFee,
        logger,
      })
    }
    return revertTransaction({
      paymentLiabilityTx,
      lnPaymentLookup,
      logger: paymentLogger,
    })
  }
}

const reimburseFee = async ({
  walletId,
  paymentLiabilityTx,
  roundedUpFee,
  logger,
}: {
  walletId: WalletId
  paymentLiabilityTx: LedgerTransaction
  roundedUpFee: Satoshis
  logger: Logger
}): Promise<void | ApplicationError> => {
  const { paymentHash } = paymentLiabilityTx
  // If we had PaymentLedgerType => no need for checking the fields
  if (!paymentHash)
    return new InconsistentDataError("paymentHash missing from payment transaction")

  if (!paymentLiabilityTx.feeKnownInAdvance) {
    const feeDifference = FeeReimbursement(paymentLiabilityTx.fee).getReimbursement({
      actualFee: roundedUpFee,
    })
    if (feeDifference === null) {
      logger.warn(
        `Invalid reimbursement fee for ${{
          maxFee: paymentLiabilityTx.fee,
          actualFee: roundedUpFee,
        }}`,
      )
      return
    }

    logger.info(
      {
        paymentResult: paymentLiabilityTx,
        feeDifference,
        maxFee: paymentLiabilityTx.fee,
        actualFee: roundedUpFee,
        id: paymentHash,
      },
      "logging a fee difference",
    )

    const price = await PriceService().getCurrentPrice()
    if (price instanceof Error) return price
    const usd = feeDifference * price

    const liabilitiesAccountId = toLiabilitiesAccountId(walletId)
    const ledgerService = LedgerService()
    const result = await ledgerService.receiveLnFeeReimbursement({
      liabilitiesAccountId,
      paymentHash: paymentHash,
      sats: feeDifference,
      usd,
      journalId: paymentLiabilityTx.journalId,
    })
    if (result instanceof Error) return result
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
