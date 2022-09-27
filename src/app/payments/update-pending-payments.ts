import { toSats } from "@domain/bitcoin"
import { defaultTimeToExpiryInSeconds, PaymentStatus } from "@domain/bitcoin/lightning"
import { InconsistentDataError } from "@domain/errors"
import {
  CouldNotFindTransactionError,
  inputAmountFromLedgerTransaction,
  LedgerTransactionType,
  UnknownLedgerError,
} from "@domain/ledger"
import { MissingPropsInTransactionForPaymentFlowError } from "@domain/payments"
import { setErrorCritical, WalletCurrency } from "@domain/shared"

import { LedgerService, getNonEndUserWalletIds } from "@services/ledger"
import { LndService } from "@services/lnd"
import { LockService } from "@services/lock"
import {
  AccountsRepository,
  PaymentFlowStateRepository,
  WalletsRepository,
} from "@services/mongoose"
import { addAttributesToCurrentSpan, wrapAsyncToRunInSpan } from "@services/tracing"

import { Wallets } from "@app"
import { runInParallel } from "@utils"

import { PaymentFlowFromLedgerTransaction } from "./translations"

export const updatePendingPayments = async (logger: Logger): Promise<void> => {
  const ledgerService = LedgerService()
  const walletIdsWithPendingPayments = ledgerService.listWalletIdsWithPendingPayments()

  if (walletIdsWithPendingPayments instanceof Error) {
    logger.error(
      { error: walletIdsWithPendingPayments },
      "finish updating pending payments with error",
    )
    return
  }

  await runInParallel({
    iterator: walletIdsWithPendingPayments,
    logger,
    processor: async (walletId: WalletId, index: number) => {
      logger.trace(
        "updating pending payments for walletId %s in worker %d",
        walletId,
        index,
      )
      await updatePendingPaymentsByWalletId({ walletId, logger })
    },
  })

  logger.info("finish updating pending payments")
}

export const updatePendingPaymentsByWalletId = wrapAsyncToRunInSpan({
  namespace: "app.payments",
  fnName: "updatePendingPaymentsByWalletId",
  fn: async ({
    walletId,
    logger,
  }: {
    walletId: WalletId
    logger: Logger
  }): Promise<void | ApplicationError> => {
    const ledgerService = LedgerService()
    const count = await ledgerService.getPendingPaymentsCount(walletId)
    if (count instanceof Error) return count

    addAttributesToCurrentSpan({ pendingPaymentsCount: count })
    if (count === 0) return

    const pendingPayments = await ledgerService.listPendingPayments(walletId)
    if (pendingPayments instanceof Error) return pendingPayments

    for (const pendingPayment of pendingPayments) {
      await updatePendingPayment({
        walletId,
        pendingPayment,
        logger,
      })
    }
  },
})

const updatePendingPayment = wrapAsyncToRunInSpan({
  namespace: "app.payments",
  fnName: "updatePendingPayment",
  fn: async ({
    walletId,
    pendingPayment,
    logger,
  }: {
    walletId: WalletId
    pendingPayment: LedgerTransaction<WalletCurrency>
    logger: Logger
  }): Promise<true | ApplicationError> => {
    const { paymentHash, pubkey, type: txType } = pendingPayment
    addAttributesToCurrentSpan({ walletId, paymentHash, txType })

    const paymentLogger = logger.child({
      topic: "payment",
      protocol: "lightning",
      transactionType: "payment",
      onUs: false,
      payment: pendingPayment,
    })

    const lndService = LndService()
    if (lndService instanceof Error) return lndService

    // If we had PaymentLedgerType => no need for checking the fields
    if (!paymentHash)
      throw new InconsistentDataError("paymentHash missing from payment transaction")
    if (!pubkey)
      throw new InconsistentDataError("pubkey missing from payment transaction")

    const lnPaymentLookup = await lndService.lookupPayment({
      pubkey,
      paymentHash,
    })
    if (lnPaymentLookup instanceof Error) {
      logger.error(
        {
          err: lnPaymentLookup,
          topic: "payment",
          protocol: "lightning",
          transactionType: "payment",
          onUs: false,
        },
        "issue fetching payment",
      )
      return lnPaymentLookup
    }

    let roundedUpFee: Satoshis
    const { status } = lnPaymentLookup
    if (status != PaymentStatus.Failed) {
      roundedUpFee = lnPaymentLookup.confirmedDetails?.roundedUpFee || toSats(0)
    }

    if (status === PaymentStatus.Settled || status === PaymentStatus.Failed) {
      return LockService().lockPaymentHash(paymentHash, async () => {
        const ledgerService = LedgerService()
        const recorded = await ledgerService.isLnTxRecorded(paymentHash)
        if (recorded instanceof Error) {
          paymentLogger.error(
            { error: recorded },
            "we couldn't query pending transaction",
          )
          return recorded
        }

        if (recorded) {
          paymentLogger.info("payment has already been processed")
          return true
        }

        const inputAmount = inputAmountFromLedgerTransaction(pendingPayment)
        if (inputAmount instanceof Error) return inputAmount

        const paymentFlowIndex: PaymentFlowStateIndex = {
          paymentHash,
          walletId,
          inputAmount,
        }

        let paymentFlow = await PaymentFlowStateRepository(
          defaultTimeToExpiryInSeconds,
        ).markLightningPaymentFlowNotPending(paymentFlowIndex)
        if (paymentFlow instanceof Error) {
          paymentFlow = await reconstructPendingPaymentFlow(paymentHash)
          if (paymentFlow instanceof Error) return paymentFlow
        }

        const settled = await ledgerService.settlePendingLnPayment(paymentHash)
        if (settled instanceof Error) {
          paymentLogger.error({ error: settled }, "no transaction to update")
          return settled
        }

        if (status === PaymentStatus.Settled) {
          paymentLogger.info(
            { success: true, id: paymentHash, payment: pendingPayment },
            "payment has been confirmed",
          )

          const revealedPreImage = lnPaymentLookup.confirmedDetails?.revealedPreImage
          if (revealedPreImage)
            LedgerService().updateMetadataByHash({
              hash: paymentHash,
              revealedPreImage,
            })
          if (pendingPayment.feeKnownInAdvance) return true

          const { displayAmount, displayFee } = pendingPayment
          if (displayAmount === undefined || displayFee === undefined)
            return new UnknownLedgerError("missing display-related values in transaction")

          return Wallets.reimburseFee({
            paymentFlow,
            journalId: pendingPayment.journalId,
            actualFee: roundedUpFee,
            revealedPreImage,
          })
        } else if (status === PaymentStatus.Failed) {
          paymentLogger.warn(
            { success: false, id: paymentHash, payment: pendingPayment },
            "payment has failed. reverting transaction",
          )
          if (paymentFlow.senderWalletCurrency === WalletCurrency.Btc) {
            const voided = await ledgerService.revertLightningPayment({
              journalId: pendingPayment.journalId,
              paymentHash,
            })
            if (voided instanceof Error) {
              const error = `error voiding payment entry`
              logger.fatal({ success: false, result: lnPaymentLookup }, error)
              return setErrorCritical(voided)
            }
          } else {
            const reimbursed = await Wallets.reimburseFailedUsdPayment({
              journalId: pendingPayment.journalId,
              paymentFlow,
            })
            if (reimbursed instanceof Error) {
              const error = `error reimbursing usd payment entry`
              logger.fatal({ success: false, result: lnPaymentLookup }, error)
              return setErrorCritical(reimbursed)
            }
          }
        }
        return true
      })
    }
    return true
  },
})

const reconstructPendingPaymentFlow = async <
  S extends WalletCurrency,
  R extends WalletCurrency,
>(
  paymentHash: PaymentHash,
): Promise<PaymentFlow<S, R> | ApplicationError> => {
  const ledgerTxns = await LedgerService().getTransactionsByHash(paymentHash)
  if (ledgerTxns instanceof Error) return ledgerTxns

  const nonEndUserWalletIds = Object.values(await getNonEndUserWalletIds())

  const payment = ledgerTxns.find(
    (tx) =>
      tx.pendingConfirmation === true &&
      tx.type === LedgerTransactionType.Payment &&
      tx.debit > 0 &&
      tx.walletId !== undefined &&
      !nonEndUserWalletIds.includes(tx.walletId),
  ) as LedgerTransaction<S> | undefined
  if (!payment) return new CouldNotFindTransactionError()

  const { walletId: senderWalletId } = payment
  if (!senderWalletId) return new MissingPropsInTransactionForPaymentFlowError()
  const senderWallet = await WalletsRepository().findById(senderWalletId)
  if (senderWallet instanceof Error) return senderWallet
  const senderAccount = await AccountsRepository().findById(senderWallet.accountId)
  if (senderAccount instanceof Error) return senderAccount

  return PaymentFlowFromLedgerTransaction({
    ledgerTxn: payment,
    senderAccountId: senderAccount.id,
  })
}
