import { PaymentStatus } from "@domain/bitcoin/lightning"
import { ValidationError } from "@domain/errors"
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
    const pendingPayments = await ledgerService.getPendingPayments(liabilitiesAccountId)
    if (pendingPayments instanceof Error) return pendingPayments

    for (const payment of pendingPayments) {
      await updatePendingPayment({ walletId, payment, logger })
    }
  })
}

const updatePendingPayment = async ({
  walletId,
  payment,
  logger,
  lock,
}: {
  walletId: WalletId
  payment: LedgerTransaction
  logger: Logger
  lock?: DistributedLock
}): Promise<void | ApplicationError> => {
  const paymentLogger = logger.child({
    topic: "payment",
    protocol: "lightning",
    transactionType: "payment",
    onUs: false,
    payment,
  })

  const lndService = LndService()
  if (lndService instanceof Error) return lndService

  const { paymentHash, pubkey } = payment
  if (!paymentHash)
    return new ValidationError("paymentHash missing from payment transaction")
  if (!pubkey) return new ValidationError("pubkey missing from payment transaction")

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

    if (status === PaymentStatus.Settled) {
      paymentLogger.info(
        { success: true, id: paymentHash, payment },
        "payment has been confirmed",
      )
      return reimburseFee({
        walletId,
        payment,
        roundedUpFee,
        logger,
      })
    }
    return revertTransaction({
      payment,
      lnPaymentLookup,
      logger: paymentLogger,
    })
  }
}

const reimburseFee = async ({
  walletId,
  payment,
  roundedUpFee,
  logger,
}: {
  walletId: WalletId
  payment: LedgerTransaction
  roundedUpFee: Satoshis
  logger: Logger
}): Promise<void | ApplicationError> => {
  const { paymentHash } = payment
  if (!paymentHash)
    return new ValidationError("paymentHash missing from payment transaction")

  if (!payment.feeKnownInAdvance) {
    const feeDifference = FeeReimbursement({
      prepaidFee: payment.fee,
    }).getReimbursement({ actualFee: roundedUpFee })
    if (feeDifference === null) {
      logger.warn(
        `Invalid reimbursement fee for ${{
          maxFee: payment.fee,
          actualFee: roundedUpFee,
        }}`,
      )
      return
    }

    logger.info(
      {
        paymentResult: payment,
        feeDifference,
        maxFee: payment.fee,
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
      journalId: payment.journalId,
    })
    if (result instanceof Error) return result
  }
}

const revertTransaction = async ({
  payment,
  lnPaymentLookup,
  logger,
}: {
  payment: LedgerTransaction
  lnPaymentLookup: LnPaymentLookup
  logger: Logger
}): Promise<void | ApplicationError> => {
  const ledgerService = LedgerService()
  const voided = await ledgerService.voidLedgerTransactionsForJournal(payment.journalId)
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
