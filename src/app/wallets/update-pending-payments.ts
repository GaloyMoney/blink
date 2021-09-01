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
  lock?: PaymentHashLock // Change to DistributedLock
}): Promise<void | ApplicationError> => {
  const ledgerService = LedgerService()
  const liabilitiesAccountId = toLiabilitiesAccountId(walletId)
  const count = await ledgerService.getPendingPaymentsCount(liabilitiesAccountId) // redudant right?
  if (count instanceof Error) throw count
  if (count === 0) return

  const lockService = LockService()
  await lockService.lockWalletId(
    {
      walletId,
      logger,
      lock, // support passing enegric lock (even though unsafe)
    },
    async () => {
      const pendingPayments = await ledgerService.getPendingPayments(liabilitiesAccountId) // rename to listPending
      if (pendingPayments instanceof Error) return pendingPayments
      pendingPayments.length // instead of getPendingPaymentsCount
      for (const payment of pendingPayments) {
        await updatePendingPayment({ liabilitiesAccountId, payment, logger })
      }
    },
  )
}

const updatePendingPayment = async ({
  walletId, // should be liabilitiesAccountId
  payment,
  logger,
  lock,
}: {
  walletId: WalletId
  payment: LedgerTransaction
  logger: Logger
  lock?: PaymentHashLock
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
  // If we had PaymentLedgerType => no need for checking the fields
  if (!paymentHash)
    return new ValidationError("paymentHash missing from payment transaction") // ValidationError for user input!
  // InconsistentDataError!!! better to enforce via type! but if enforced at runtime then like that
  if (!pubkey) return new ValidationError("pubkey missing from payment transaction")

  const lnPaymentLookup = await lndService.lookupPayment({
    pubkey,
    paymentHash,
    logger,
  })
  if (lnPaymentLookup instanceof Error) {
    logger.log() // instead of injecting logger into service
    return lnPaymentLookup
  }
  // const { isSettled, isFailed, safeFee } = lnPaymentLookup
  const { status } = lnPaymentLookup

  // if (isSettled || isFailed) {
  if (status === PaymentStatus.Settled || status === PaymentStatus.Failed) {
    const ledgerService = LedgerService()
    const settled = await ledgerService.settlePendingLiabilityTransactions(paymentHash)
    if (settled instanceof Error) {
      paymentLogger.error({ error: settled }, "we didn't have any transaction to update")
      return settled
    }

    if (status === PaymentStatus.Settled) {
      // reimbureFee()
      // } else { revertTransaction() }
      paymentLogger.info(
        { success: true, id: paymentHash, payment },
        "payment has been confirmed",
      )
      if (!payment.feeKnownInAdvance) {
        FeeReimbursement({ prepaidFee: payment.fee }).getReimbursemen({
          actualFee: lookup.roundedUpFee,
        })
        // const maxFee = payment.fee
        // const actualFee = toSats(safeFee || 0)
        // const feeDifference = FeeDifferenceCalculator().paymentFeeDifference({
        //   maxFee,
        //   actualFee,
        // })
        if (feeDifference === null) {
          logger.warn() // return
          return
        }

        logger.info(
          { paymentResult: payment, feeDifference, maxFee, actualFee, id: paymentHash },
          "logging a fee difference",
        )

        // interfacte UsdConverter {
        //   convert(sats: Satoshi): Usd
        // }
        // const converter = await PriceConverterRepository().getConverter(Currenty.USD)
        // if (price instanceof Error) return price
        // const usd = await converter.convert(feeDifference)

        // const liabilitiesAccountId = toLiabilitiesAccountId(walletId) // seems redundant to call it againt
        const result = await ledgerService.receiveLnFeeReimbursement({
          liabilitiesAccountId,
          paymentHash,
          sats: feeDifference,
          usd,
          journalId: payment.journalId, // rename payment -> paymentLedgerTx
        })
        if (result instanceof Error) return result
      }
    } else {
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
