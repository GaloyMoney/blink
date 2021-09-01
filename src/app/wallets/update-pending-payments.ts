import { toSats } from "@domain/bitcoin"
import { ValidationError } from "@domain/errors"
import { toLiabilitiesAccountId } from "@domain/ledger"
import { FeeDifferenceCalculator } from "@domain/ledger/fee-difference-calculator"
import { LedgerService } from "@services/ledger"
import { LndService } from "@services/lnd"
import { LockService } from "@services/lock"
import { WalletInvoicesRepository } from "@services/mongoose"
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
    logger,
  })
  if (lnPaymentLookup instanceof Error) return lnPaymentLookup
  const { isSettled, isFailed, safeFee } = lnPaymentLookup

  if (isSettled || isFailed) {
    const ledgerService = LedgerService()
    const settled = await ledgerService.settlePendingLiabilityTransactions(paymentHash)
    if (settled instanceof Error) {
      paymentLogger.error({ error: settled }, "we didn't have any transaction to update")
      return settled
    }

    if (isSettled) {
      paymentLogger.info(
        { success: true, id: paymentHash, payment },
        "payment has been confirmed",
      )
      if (!payment.feeKnownInAdvance) {
        const maxFee = payment.fee
        const actualFee = toSats(safeFee || 0)
        const feeDifference = FeeDifferenceCalculator().paymentFeeDifference({
          maxFee,
          actualFee,
        })
        if (feeDifference instanceof Error) return feeDifference

        logger.info(
          { paymentResult: payment, feeDifference, maxFee, actualFee, id: paymentHash },
          "logging a fee difference",
        )

        const price = await PriceService().getCurrentPrice()
        if (price instanceof Error) return price
        const usd = feeDifference * price

        const liabilitiesAccountId = toLiabilitiesAccountId(walletId)
        const result = await ledgerService.receiveLnFeeReimbursement({
          liabilitiesAccountId,
          paymentHash,
          sats: feeDifference,
          usd,
          journalId: payment.journalId,
        })
        if (result instanceof Error) return result
      }
    }

    if (isFailed) {
      const voided = await ledgerService.voidLedgerTransactionsForJournal(
        payment.journalId,
      )
      if (voided instanceof Error) {
        const error = `error voiding payment entry`
        paymentLogger.fatal(
          {
            success: false,
            result: lnPaymentLookup,
          },
          error,
        )
        return voided
      }
    }
  }
  return
}
